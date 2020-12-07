'use strict';

const log = require('../config/log');
const path = require('path');
const fse = require('fs-extra');
const Product = require('../model/product');
const dealerUtil = require('./dealerUtil');

const Fuse = require('fuse.js');
const fuseOptions = {
  // isCaseSensitive: false,
  // includeScore: true,
  shouldSort: true,
  // includeMatches: false,
  // findAllMatches: false,
  minMatchCharLength: 2,
  // location: 0,
  // threshold: 0.6,
  // distance: 100,
  // useExtendedSearch: false,
  ignoreLocation: true,
  // ignoreFieldNorm: false,
  keys: [
    "storeProductTitle",
    // "author.firstName"
  ]
};
let productsFuse;
// Init fuse.
function initFuse() {
    try {
        // Get all products not deleted.
        Product.find({deletedAt: {$exists: false}})
        .then(products=>{
            productsFuse = new Fuse(products, fuseOptions);
        })
        .catch(err=>{
            log.error(err.stack);
        });
    } catch(err) {
        log.error(new Error(`Initializing products fuse. catch: ${err}`));
    }
};
initFuse();

// Get similar product.
function getSimilarTitlesProducts(searchText) {
    let products = productsFuse.search(searchText);

    // log.debug(`searchText: ${searchText}`);
    let justProducts = [];
    // for (let product of products) {
        // // log.debug(`refIndex: ${JSON.stringify(product.refIndex, null, 2)}`);
        // // log.debug(`score: ${JSON.stringify(product.score, null, 2)}`);
        // log.debug(`title: ${JSON.stringify(product.item.storeProductTitle, null, 2)}`);
        // justProducts.push(product.item);
    // }
    for (let i=0; i<10 && products.length > i; i++) {
        justProducts.push(products[i].item);
    }
    return justProducts;
}

// Get products with same EAN.
async function getSameEanProducts(ean) {
    try {
        // console.log(`getSameEanProducts ean: ${ean}`);
        const products = await Product.find({ean: ean.trim(), deletedAt: {$exists: false}, storeProductId: {$regex: /\S/}}).exec();
        // const products = await Product.find({ean: ean.trim()}).exec();
        // console.log(`products: ${products}`);
        return products;
    } catch (err) {
        log.error(`Getting products with same EAN. catch: ${err.message}`);
        return([]);
    }
}

// Update commercialize status.
function updateCommercializeStatus() {
    try {
        // Get all products not deleted.
        Product.find({deletedAt: {$exists: false}})
        .then(products=>{
            // Update fuse search.
            productsFuse = new Fuse(products, fuseOptions);
            let productsByzunkaId = new Map();
            for (let product of products) {
                // Have store product id, include zunka id map.
                if (product.storeProductId) {
                    let productArray = productsByzunkaId.get(product.storeProductId);
                    if (productArray) {
                        productArray.push(product);
                    } else {
                        let productArray = [];
                        productArray.push(product);
                        productsByzunkaId.set(product.storeProductId, productArray);
                    }
                }
                // Not commercialize product without store product id.
                else {
                    // log.warn(`Product ${product._id} without storeProductId`);
                    if (product.storeProductCommercialize) {
                        product.storeProductCommercialize = false;
                        product.save(err=>{
                            if (err) {
                                log.error(`Updating product commercialize status. ${err.message}`);
                            } else {
                                log.debug(`Product ${product._id} setted to not be commercialized.`);
                            }
                        });
                    } 
                }
            }
            for (let [key, value] of productsByzunkaId) {
                updateCommercializeStatusForSameProducts(value);
            }
        })
        .catch(err=>{
            log.error(err.stack);
        });
    } catch(err) {
        log.error(new Error(`Setting cheapest product to commercialize. catch: ${err}`));
    }
};

function updateCommercializeStatusForSameProducts (products) {
    let cheaperProductId;
    let cheaperPrice = Number.MAX_SAFE_INTEGER;
    // List of same products from different dealers.
    // First loop find the cheaper that can be commercialized.
    for (let product of products) {
        // log.debug(`product ${product.storeProductId}, dealer activation: ${dealerUtil.isDealerActive(product.dealerName)}`);
        // Product can be commercialized.
        if (
            dealerUtil.isDealerActive(product.dealerName) &&
            product.storeProductTitle != "" &&
            product.dealerProductActive &&
            product.storeProductActive &&
            product.storeProductPrice > 100 &&
            product.storeProductQtd > 0 &&
            !product.deletedAt) 
        {
            // Cheaper product that can be commercialized.
            if (product.storeProductPrice < cheaperPrice) {
                cheaperPrice = product.storeProductPrice;
                cheaperProductId = product._id;
            }
        } 
    }

    // List of same products from differents dealers.
    // Second loop set commercialize.
    for (let product of products) {
        // Update if not already set as commercialize.
        if (product._id == cheaperProductId && !product.storeProductCommercialize) {
            product.storeProductCommercialize = true;
            product.save(err=>{
                if (err) {
                    log.error(`Updating product commercialize status. ${err.message}`);
                } else {
                    log.debug(`Product ${product._id} setted to be commercialized.`);
                }
            });
        } 
        // Update if not already set to not commercialize.
        if (product._id != cheaperProductId && product.storeProductCommercialize) {
            if (product.storeProductCommercialize) {
                product.storeProductCommercialize = false;
                product.save(err=>{
                    if (err) {
                        log.error(`Updating product commercialize status. ${err.message}`);
                    } else {
                        log.debug(`Product ${product._id} setted to not be commercialized.`);
                    }
                });
            }
        }
    }
}

function updateProductsWithSameStoreProductId(changedProduct) {
    // Not update product without store product id.
    if (changedProduct.storeProductId.trim() == "") {
        return;
    }
    // Update all with the same store product id, but not it self. 
    Product.updateMany(
        {storeProductId: changedProduct.storeProductId, _id: {$ne: changedProduct._id}},
        {
            storeProductTitle: changedProduct.storeProductTitle,
            storeProductInfoMD: changedProduct.storeProductInfoMD,
            storeProductDetail: changedProduct.storeProductDetail,
            storeProductDescription: changedProduct.storeProductDescription,
            storeProductTechnicalInformation: changedProduct.storeProductTechnicalInformation,
            storeProductAdditionalInformation: changedProduct.storeProductAdditionalInformation,
            storeProductMaker: changedProduct.storeProductMaker,
            storeProductCategory: changedProduct.storeProductCategory,
            storeProductLength: changedProduct.storeProductLength,
            storeProductHeight: changedProduct.storeProductHeight,
            storeProductWidth: changedProduct.storeProductWidth,
            storeProductWeight: changedProduct.storeProductWeight,
            storeProductMarkup: changedProduct.storeProductMarkup,
            storeProductWarrantyDays: changedProduct.storeProductWarrantyDays,
            storeProductWarrantyDetail: changedProduct.storeProductWarrantyDetail,
            warrantyMarkdownName: changedProduct.warrantyMarkdownName,
            // Deprecatade - begin.
            includeWarrantyText: changedProduct.includeWarrantyText,
            // Deprecatade - end.
            images: changedProduct.images,
            includeOutletText: changedProduct.includeOutletText,
            displayPriority: changedProduct.displayPriority,
            ean: changedProduct.ean,
            marketZoom: changedProduct.marketZoom
        }, 
        (err, result)=>{
            if (err) {
                log.error(`Updating product with same store product id ${changedProduct.storeProductId}. ${err.message}`);
            }
            // log.debug(`result: ${JSON.stringify(result, null, 2)}`);
            updateCommercializeStatus();
            // Update image files.
            Product.find({storeProductId: changedProduct.storeProductId}, (err, products)=>{
                if (err) {
                    log.error(`Find product with same store product id ${changedProduct.storeProductId}. ${err.message}`);
                }
                for (let product of products) {
                    if (product._id.toString() != changedProduct._id.toString()) {
                        // log.debug(`Product to update image files: ${product._id}`);
                        updateImageFiles(changedProduct, product);
                    }
                }
            });
        });
}

// Copy images from product source to product destiny.
function copyImageFiles(srcId, dstId) {
    try {
        let srcPath = path.join(__dirname, '..', 'dist/img/', srcId.toString())
        let dstPath = path.join(__dirname, '..', 'dist/img/', dstId.toString())
        fse.copySync(srcPath, dstPath);
    } catch(err) {
        log.error(err.stack);
    }
}

function updateImageFiles(productBase, productToUpdate) {
    let basePath = path.join(__dirname, '..', 'dist/img/', productBase._id.toString())
    let updatePath = path.join(__dirname, '..', 'dist/img/', productToUpdate._id.toString())
    let allImagesMustHave = [];

    // Create if not exist.
    if (!fse.existsSync(updatePath)){
        fse.mkdirSync(updatePath);
    }

    // All necessary images.
    for (let image of productToUpdate.images) {
        let pathObj = path.parse(image);
        allImagesMustHave.push(image);
        allImagesMustHave.push(pathObj.name + '_0080px' + pathObj.ext);
        allImagesMustHave.push(pathObj.name + '_0500px' + pathObj.ext);
    }

    // log.debug(`basePath: ${basePath}`);
    // log.debug(`updatePath: ${updatePath}`);
    // log.debug(`allImagesMustHave: ${JSON.stringify(allImagesMustHave, null, 2)}}`);

    // Remove no necessary images.
    fse.readdir(updatePath, (err, files)=>{
        if (err) {
            log.error(err.stack);
        }
        else {
            // log.debug(`files: ${JSON.stringify(files, null, 2)}}`);
            // Remove images not in product images.
            for (let file of files) {
                if (!allImagesMustHave.includes(file)) {
                    log.debug(`Removing image: ${path.join(updatePath, file)}`);
                    fse.remove(path.join(updatePath, file), err=>{
                        if (err) { log.error(err.stack); }
                    });
                }
            };
            // Copy missing images.
            for (let imageMustHave of allImagesMustHave) {
                if (!files.includes(imageMustHave)) {
                    log.debug(`Copying image\n\tfrom: ${path.join(basePath, imageMustHave)}\n\tto: ${path.join(updatePath, imageMustHave)}`);
                    fse.copy(path.join(basePath, imageMustHave), path.join(updatePath, imageMustHave), err => {
                        if (err) { log.error(err.stack); }
                    });
                }

            }
        }
    });
}

module.exports.updateCommercializeStatus = updateCommercializeStatus;
module.exports.updateProductsWithSameStoreProductId = updateProductsWithSameStoreProductId;

module.exports.updateImageFiles = updateImageFiles;

module.exports.getSameEanProducts = getSameEanProducts;
module.exports.getSimilarTitlesProducts = getSimilarTitlesProducts;

module.exports.copyImageFiles = copyImageFiles;

