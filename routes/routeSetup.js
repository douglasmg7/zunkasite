'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const s = require('../config/s');
const { check, validationResult } = require('express-validator/check');
// Models.
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const Product = require('../model/product');
// Utils.
const categories = require('../util/productCategories');
const makers = require('../util/productMakers.js');
const turndown = new require('turndown')();
const imageUtil = require('../util/image');
const productUtil = require('../util/productUtil');
const allnations = require('../util/allnations');

// Get a zunka product information.
router.get('/product-info', s.basicAuth, function(req, res, next) {
    // log.debug(`body: ${JSON.stringify(req.body.productsId)}`);
    // No valid productsId.
    if (!req.body.productsId || !req.body.productsId.length) {
        log.warn(`[product-info] Requested products informations with productsId: ${req.body.productsId}`);
        return res.status(400).send(`Inválid productsId: ${req.body.productsId}`);
    }
    let productsId = [];
    // Get all products ids.
    for (let i = 0; i < req.body.productsId.length; i++) {
        try {
            // productsId.push(mongoose.Types.ObjectId(req.body.productsId[i]));
            let productId = mongoose.Types.ObjectId(req.body.productsId[i]);
            productsId.push(productId);
        } catch(err){
            log.warn(`[product-info] Could not create ObjectId from req.body.productsId[${i}]: ${req.body.productsId[i]}`);
            return res.status(400).send(`Inválid product id: ${req.body.productsId[i]}`);
        }
    }
    // Get all products into cart from db.
    Product.find({'_id': { $in: productsId }}, (err, dbProducts)=>{
        if (err) {
            return res.status(500).send(err);
        }
        let products = [];
        for (let i = 0; i < dbProducts.length; i++) {
            // console.log(`dbProduct: ${dbProducts[i]}`);
            products.push({
                id: dbProducts[i]._id,
                dealer: dbProducts[i].dealerName,
                stockLocation: dbProducts[i].dealerProductLocation,
                length: dbProducts[i].storeProductLength,
                width: dbProducts[i].storeProductWidth,
                height: dbProducts[i].storeProductHeight,
                weight: dbProducts[i].storeProductWeight,
                price: dbProducts[i].storeProductPrice,
            });
        }
        return res.json(products);
    });
});

// Get all zunkasite products by dealer.
router.get('/products/:dealer', s.basicAuth, function(req, res, next) {
    try{
        // Get all products into cart from db.
        let dealerName = req.params.dealer.charAt(0).toUpperCase() + req.params.dealer.slice(1).toLowerCase();
        Product.find({dealerName: dealerName, deletedAt: {$exists: false}}, (err, dbProducts)=>{
            if (err) {
                log.error(`Getting all Aldo products: ${err.stack}`);
                return res.status(500).send(err);
            }
            let products = [];
            for (let i = 0; i < dbProducts.length; i++) {
                // console.log(`dbProduct: ${dbProducts[i]}`);
                // log.debug(`product: ${dbProducts[i]._id} deletedAt: ${dbProducts[i].deletedAt}, dealerProductId: ${dbProducts[i].dealerProductId}, storeProductQtd: ${dbProducts[i].storeProductQtd}`);
                products.push({
                    id: dbProducts[i]._id,
                    dealerProductId: dbProducts[i].dealerProductId,
                    dealerProductActive: dbProducts[i].dealerProductActive,
                    dealerProductPrice: dbProducts[i].dealerProductPrice,
                    storeProductQtd: dbProducts[i].storeProductQtd,
                });
            }
            return res.json(products);
        });
    } catch(err) {
        log.error(`[catch] Getting all Aldo products: ${err.stack}`);
        return res.status(500).send(err);
    }
});

// Get products by EAN.
router.get('/products-same-ean', s.basicAuth, async function(req, res, next) {
    try {
        let products = await productUtil.getSameEanProducts(req.query.ean);
        // log.debug(`router products: ${products}`);
        return res.json(products);
    } catch(err) {
        log.error(`[catch] Getting products by EAN: ${err.stack}`);
        return res.status(500).send(err);
    }
});

// Get similar products.
router.get('/products-similar-title', s.basicAuth, function(req, res, next) {
    try {
        let products = productUtil.getSimilarTitlesProducts(req.query.title);
        // log.debug(`router products: ${products.length}`);
        return res.json(products);
    } catch(err) {
        log.error(`[catch] Getting products with similiar titles: ${err.stack}`);
        return res.status(500).send(err);
    }
});

// Add product.
router.post('/product/add', s.basicAuth, [
		check('dealerName').isLength(4, 20),
		check('dealerProductId').isLength(1, 20),
		check('dealerProductTitle').isLength(4, 200),
		// check('dealerProductDesc').isLength(4, 30000),   // Some products do not have description
		check('dealerProductCategory').isLength(4, 200),
		check('dealerProductMaker').isLength(2, 200),
		check('dealerProductWarrantyDays').isNumeric(),
		check('dealerProductDeep').isNumeric(),
		check('dealerProductHeight').isNumeric(),
		check('dealerProductWidth').isNumeric(),
		check('dealerProductWeight').isNumeric(),
		check('dealerProductActive').isBoolean(),
		check('dealerProductPrice').isNumeric(),
		check('dealerProductFinalPriceSuggestion').isNumeric(),
		check('dealerProductLastUpdate').isISO8601(),
		// check('ean').isNumeric(),
		// check('ean').isLength(13),
], (req, res, next)=>{
	try {
		// log.debug("Headers: " + JSON.stringify(req.headers, null, 3));
		// Check erros.
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// log.debug(JSON.stringify(errors.array(), null, 2));
			return res.status(422).json({ erros: errors.array() });
		}
        // log.debug("req.body: " + JSON.stringify(req.body, null, 2));
		// Create product.
		let product = {};
		product.dealerName = req.body.dealerName;
		product.dealerProductId = req.body.dealerProductId;
		product.dealerProductTitle = req.body.dealerProductTitle;
        product.dealerProductDesc = req.body.dealerProductDesc;
		product.dealerProductCategory = categories.selectCategory(req.body.dealerProductCategory);
		product.dealerProductMaker = makers.selectMaker(req.body.dealerProductMaker);
		product.dealerProductWarrantyDays = req.body.dealerProductWarrantyDays;
		product.dealerProductDeep = req.body.dealerProductDeep;
		product.dealerProductHeight = req.body.dealerProductHeight;
		product.dealerProductWidth = req.body.dealerProductWidth;
		product.dealerProductWeight = req.body.dealerProductWeight;
		product.dealerProductPrice = parseFloat(req.body.dealerProductPrice) / 100;
		product.dealerProductActive = req.body.dealerProductActive;
		product.dealerProductLastUpdate = req.body.dealerProductLastUpdate;
        if (req.body.dealerProductLocation) {
            product.dealerProductLocation = req.body.dealerProductLocation;
        }
        if (req.body.ean) {
            product.ean = req.body.ean;
        }
		// log.debug(`product: ${JSON.stringify(product, null, 2)}`);
		// Verify if product exist.
		Product.findOne({dealerName: product.dealerName, dealerProductId: product.dealerProductId}, (err, doc)=>{
			if (err) {
				log.error(`Finding product: ${err.message}`);
				return res.status(500).send(err);
			}
			// Product exist and not marked as deleted.
			if (doc && !doc.deletedAt) {
				// Update only dealer data.
				Product.updateOne({dealerName: product.dealerName, dealerProductId: product.dealerProductId}, product, err=>{
					if (err) {
						log.error(`Updating ${product.dealerName} product: ${err.message}`);
						return res.status(500).send(err);
					}
					log.debug(`Product ${product.dealerName} ${doc._id} was updated by zunkasrv.`, doc._id);
					return res.send(doc._id);
				});
			} 
			// Product not exist.
			else {
				// Create dealer and store data.
				product.storeProductId = "";
				product.storeProductTitle = product.dealerProductTitle;
                product.storeProductDescription = "";
				product.storeProductDetail = "";
                product.storeProductInfoMD = turndown.turndown(product.dealerProductDesc);
				product.storeProductTechnicalInformation = "";
				product.storeProductAdditionalInformation = "";
				product.storeProductCategory = product.dealerProductCategory;
				product.storeProductMaker = product.dealerProductMaker;;
				product.storeProductLength = product.dealerProductDeep;
				product.storeProductHeight = product.dealerProductHeight;
				product.storeProductWidth = product.dealerProductWidth;
				product.storeProductWeight = product.dealerProductWeight;
				product.storeProductPrice = parseFloat(req.body.dealerProductFinalPriceSuggestion) / 100;
                product.storeProductActive = false;
				product.storeProductCommercialize = false;
                product.storeProductMarkup = parseFloat((((product.storeProductPrice / product.dealerProductPrice) -1) * 100).toFixed(2));
				product.storeProductDiscountEnable = false;
				product.storeProductDiscountType = "%";
				product.storeProductDiscountValue = 5;
				product.storeProductWarrantyDays = 0;
				product.storeProductWarrantyDetail = "";
				product.storeProductQtdSold = 0;
                // Allnations send product quantity.
                if (req.body.storeProductQtd) {
                    product.storeProductQtd = req.body.storeProductQtd;
                } 
                // Aldo not send product quantity.
                else {
                    product.storeProductQtd = 1;
                }
                product.displayPriority = 200;
				let newProduct = new Product(product);
				newProduct.save((err, savedProduct)=>{
					if (err) {
						log.error(`Creating ${product.dealerName} product from zunkasrv: ${err.message}`);
						return res.status(500).send(err);
					}
                    // Only import images from dealer if not using template.
                    if (!req.body.productIdTemplate) {
                        // Import aldo images.
                        if (savedProduct.dealerName.toLowerCase() == "aldo") {
                            // log.debug(`req.body.dealerProductImagesLink: ${req.body.dealerProductImagesLink}`);
                            if (req.body.dealerProductImagesLink) {
                                let imagesLink = req.body.dealerProductImagesLink.split('__,__');
                                imageUtil.downloadAldoImagesAndUpdateProduct(imagesLink, savedProduct); 
                            }
                        } 
                        // Import allnations images.
                        else if (savedProduct.dealerName.toLowerCase() == "allnations") {
                            if (req.body.dealerProductImagesLink) {
                                // Set correct image size.
                                let imageLink = req.body.dealerProductImagesLink.replace("h=196", "h=1000");
                                imageLink = imageLink.replace("l=246", "l=1000");
                                imageUtil.downloadAllnationsImagesAndUpdateProduct(imageLink, 1, savedProduct); 
                            }
                        }
                    }
					log.debug(`Product ${product.dealerName} ${savedProduct._id} was created by zunkasrv.`, savedProduct._id);
					res.send(savedProduct._id);
                    // Update product with template information.
                    if (req.body.productIdTemplate) {
                        // Find template product.
                        Product.findById(req.body.productIdTemplate, (err, productTpl)=>{
                            if (err) {
                                log.error(`Finding product template: ${err.message}`);
                            }
                            // Product exist and not marked as deleted.
                            if (productTpl) {
                                savedProduct.storeProductId = productTpl.storeProductId;
                                savedProduct.storeProductTitle = productTpl.storeProductTitle;
                                savedProduct.storeProductInfoMD = productTpl.storeProductInfoMD;
                                savedProduct.storeProductDetail = productTpl.storeProductDetail;
                                savedProduct.storeProductDescription = productTpl.storeProductDescription;
                                savedProduct.storeProductTechnicalInformation = productTpl.storeProductTechnicalInformation;
                                savedProduct.storeProductAdditionalInformation = productTpl.storeProductAdditionalInformation;
                                savedProduct.storeProductMaker = productTpl.storeProductMaker;
                                savedProduct.storeProductCategory = productTpl.storeProductCategory;
                                savedProduct.storeProductLength = productTpl.storeProductLength;
                                savedProduct.storeProductHeight = productTpl.storeProductHeight;
                                savedProduct.storeProductWidth = productTpl.storeProductWidth;
                                savedProduct.storeProductWeight = productTpl.storeProductWeight;
                                savedProduct.storeProductMarkup = productTpl.storeProductMarkup;
                                savedProduct.images = productTpl.images;
                                savedProduct.includeOutletText = productTpl.includeOutletText;
                                savedProduct.displayPriority = productTpl.displayPriority;
                                savedProduct.ean = productTpl.ean;
                                savedProduct.marketZoom = productTpl.marketZoom;
                                savedProduct.save((err)=>{
                                    if (err) {
                                        log.error(`Updating created product ${savedProduct._id} with information from template product ${productTpl._id}: ${err.message}`);
                                        return res.status(500).send(err);
                                    }
                                    productUtil.updateImageFiles(productTpl, savedProduct)
                                    log.debug(`product ${savedProduct._id} updated with information from template product ${productTpl._id}`);
                                });
                            } 
                        });
                    }
                });
            }
		});
	} catch(err) {
		log.error(`Adding Aldo product: ${err.message}`);
		return res.status(500).send(err);
	}
});

// Update product price, quantity and availability.
router.post('/product/update', s.basicAuth, [
		check('storeProductId').isLength(24),
		check('dealerProductActive').isBoolean(),
		check('dealerProductPrice').isNumeric(),
], (req, res, next)=>{
	try {
		// log.debug("Headers: " + JSON.stringify(req.headers, null, 3));
		// Check erros.
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// log.debug(JSON.stringify(errors.array(), null, 2));
            // log.debug(`dealerProductPrice: ${req.body.dealerProductPrice}`);
			return res.status(422).json({ erros: errors.array() });
		}
        // log.debug("req.body: " + JSON.stringify(req.body, null, 2));
		// Verify if product exist.
		Product.findById(req.body.storeProductId, (err, product)=>{
            if (err) {
                log.error(`Updating product from service. Finding product ${req.body.storeProductId}. ${err.stack}`);
                return res.status(500).send(err);
            }
            if (!product) {
                log.warn(`Updating product from service. Product ${req.body.storeProductId} not exist.`);
                return res.status(400).send("Product not exist.");
            }
            // Product exist and not marked as deleted.
            const minPrice = 10.00;
            if (product && !product.deletedAt) {
                // Update stock.
                if (req.body.storeProductQtd) {
                    let stock = parseInt(req.body.storeProductQtd);
                    if (stock != NaN) {
                        if (product.dealerName == "Allnations") {
                            // Make stock minus minimum to sell
                            stock = stock - allnations.MIN_STOCK_TO_SELL;
                        }
                        if (stock < 0) { stock = 0; }
                        product.storeProductQtd = stock;
                    }
                }
                let dealerProductPrice = parseFloat(req.body.dealerProductPrice);
                // Inválid price.
                if (dealerProductPrice === NaN || dealerProductPrice < minPrice) {
                    return res.status(422).json({ erros: [ `dealerProductPrice: ${dealerProductPrice}, must be bigger than ${minPrice}`] });
                } 
                // Valid price.
                else {
                    product.dealerProductPrice = dealerProductPrice;
                }
                product.dealerProductActive = req.body.dealerProductActive;
                // Product inactive. Not necessary, but avoid one update from productUtil.updateCommercializeStatus().
                if (!product.dealerProductActive) {
                    product.storeProductCommercialize = false
                } 
                // Price with markup.
                let priceWithMarkup = product.dealerProductPrice * (product.storeProductMarkup / 100 + 1);
                // Use discount.
                if(product.storeProductDiscountEnable){
                    // Use percentage.
                    if(product.storeProductDiscountType === '%'){
                        product.storeProductPrice = priceWithMarkup * (1 - (product.storeProductDiscountValue / 100));
                    }
                    // Use monetary value.
                    else {
                        product.storeProductPrice = priceWithMarkup - product.storeProductDiscountValue;
                    }
                }
                // No discount.
                else {
                    product.storeProductPrice = priceWithMarkup;
                }
                // Only two digits.
                product.storeProductPrice = parseFloat(product.storeProductPrice.toFixed(2));

                // Save product.
                product.save(err=>{
                    if (err) {
                        log.error(`Updating product from service. Saving product _id: ${product._id}, dealerProductActive: ${product.dealerProductActive}, storeProductPrice: ${product.storeProductPrice}, storeProductQtd: ${product.storeProductQtd}. ${err.stack}`);
                        return res.status(500).send(err);
                    }
                    log.debug(`Product was updated from service, _id: ${product._id}, dealerProductActive: ${product.dealerProductActive}, storeProductPrice: ${product.storeProductPrice}, storeProductQtd: ${product.storeProductQtd}`);
                    productUtil.updateCommercializeStatus();
                    return res.send(product._id);
                });
            } 
		});
	} catch(err) {
		log.error(`Updating product from service: ${err.stack}`);
		return res.status(500).send(err.message);
	}
});

// Disable product.
router.post('/product/disable', s.basicAuth, [
		check('storeProductId').isLength(24),
], (req, res, next)=>{
	try {
		// log.debug("Headers: " + JSON.stringify(req.headers, null, 3));
		// Check erros.
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// log.debug(JSON.stringify(errors.array(), null, 2));
            // log.debug(`dealerProductPrice: ${req.body.dealerProductPrice}`);
			return res.status(422).json({ erros: errors.array() });
		}
        // log.debug("req.body: " + JSON.stringify(req.body, null, 2));
		// Verify if product exist.
		Product.findById(req.body.storeProductId, (err, product)=>{
            if (err) {
                log.error(`Disabling product from service. Finding product ${req.body.storeProductId}. ${err.stack}`);
                return res.status(500).send(err);
            }
            // Product exist and not marked as deleted.
            if (product && !product.deletedAt) {
                product.dealerProductActive = false;
                product.storeProductCommercialize = false
                // Save product.
                product.save(err=>{
                    if (err) {
                        log.error(`Disabling product from service. Saving product ${product._id}. ${err.stack}`);
                        return res.status(500).send(err);
                    }
                    log.debug(`Product was disabled from service, _id: ${product._id}`);
                    productUtil.updateCommercializeStatus();
                    return res.send(product._id);
                });
            } 
		});
	} catch(err) {
		log.error(`Disabling product from service: ${err.stack}`);
		return res.status(500).send(err.message);
	}
});

// Update product stock.
router.post('/product/quantity', s.basicAuth, [
		check('_id').isLength(24),
		check('storeProductQtd').isNumeric(),
], (req, res, next)=>{
	try {
		// log.debug("Headers: " + JSON.stringify(req.headers, null, 3));
		// Check erros.
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// log.debug(JSON.stringify(errors.array(), null, 2));
            // log.debug(`dealerProductPrice: ${req.body.dealerProductPrice}`);
			return res.status(422).json({ erros: errors.array() });
		}
        // log.debug("req.body: " + JSON.stringify(req.body, null, 2));
        // Update stock, using findById to update timestamps.updatedAt.
		Product.findById(req.body._id, (err, product)=>{
            if (err) {
		        log.error(`Updating product ${req.body._id} quantity from external service: ${err.stack}`);
                return res.status(500).send(err);
            }
            // Product exist and not marked as deleted.
            if (product && !product.deletedAt) {
                product.storeProductQtd = req.body.storeProductQtd;
                // Save product.
                product.save(err=>{
                    if (err) {
                        log.error(`Updating product ${req.body._id} quantity from external service: ${err.stack}`);
                        return res.status(500).send(err);
                    }
                    log.debug(`Product ${req.body._id} was updated to quantity ${req.body.storeProductQtd} by external service}`);
                    productUtil.updateCommercializeStatus();
                    return res.send();
                });
            } else {
                return res.status(422).send('Product not exist');
            }
		});
        // mongoose.connection.db.collection('products').updateOne({_id: new ObjectId(req.body._id)}, { 
            // $set: { storeProductQtd: req.body.storeProductQtd }, 
            // $currentDate: {updatedAt: true}
        // })
            // .then(()=>{
                // log.debug(`Product ${req.body._id} was updated to ${req.body.storeProductQtd} quantity by external service}`);
                // return res.send();
            // })
            // .catch(err=>{
				// log.error(`Updating product ${req.body._id} quantity from external service: ${err.stack}`);
                // return res.status(500).send(err.stack);
            // });
	} catch(err) {
		log.error(`Updating product ${req.body._id} quantity from external service: ${err.stack}`);
		return res.status(500).send(err.stack);
	}
});

module.exports = router;
