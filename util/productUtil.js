'use strict';

const log = require('../config/log');
const Product = require('../model/product');
const dealerUtil = require('./dealerUtil');

function updateCommercializeStatus() {
    try {
        // Get all products not deleted.
        Product.find({deletedAt: {$exists: false}})
        .then(products=>{
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

module.exports.updateCommercializeStatus = updateCommercializeStatus;
