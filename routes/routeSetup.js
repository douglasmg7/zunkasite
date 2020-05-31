'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const s = require('../config/s');
const { check, validationResult } = require('express-validator/check');
// Models.
const mongoose = require('mongoose');
const Product = require('../model/product');
// Utils.
const categories = require('../util/productCategories');
const makers = require('../util/productMakers.js');
const turndown = new require('turndown')();
const imageUtil = require('../util/image');

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
                id: dbProducts[i]._Id,
                dealer: dbProducts[i].dealerName,
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

// Add product.
router.post('/product/add', s.basicAuth, [
		check('dealerName').isLength(4, 20),
		check('dealerProductId').isLength(1, 20),
		check('dealerProductTitle').isLength(4, 200),
		check('dealerProductDesc').isLength(4, 30000),
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
		// log.debug(`product: ${JSON.stringify(product, null, 2)}`);
		// Verify if product exist.
		Product.findOne({dealerName: product.dealerName, dealerProductId: product.dealerProductId}, (err, doc)=>{
			if (err) {
				log.error(`Finding Aldo product: ${err.message}`);
				return res.status(500).send(err);
			}
			// Product exist and not marked as deleted.
			if (doc && !doc.deletedAt) {
				// Update only dealer data.
				Product.updateOne({dealerName: product.dealerName, dealerProductId: product.dealerProductId}, product, err=>{
					if (err) {
						log.error(`Updating Aldo product: ${err.message}`);
						return res.status(500).send(err);
					}
					log.debug(`Product ${doc._id} was updated by zunkasrv.`, doc._id);
					return res.send(doc._id);
				});
			} 
			// Product not exist.
			else {
				// Create dealer and store data.
				product.storeProductId = "";
				product.storeProductTitle = product.dealerProductTitle;
				// product.storeProductDescription = product.dealerProductDesc;
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
				product.storeProductCommercialize = false;
                product.storeProductMarkup = parseFloat((((product.storeProductPrice / product.dealerProductPrice) -1) * 100).toFixed(2));
				product.storeProductDiscountEnable = false;
				product.storeProductDiscountType = "%";
				product.storeProductDiscountValue = 5;
				product.storeProductWarrantyDays = 0;
				product.storeProductWarrantyDetail = "";
				product.storeProductQtdSold = 0;
				product.storeProductQtd = 3;
				product.storeProductActive = product.dealerProductActive;
                product.displayPriority = 200;
				let newProduct = new Product(product);
				newProduct.save((err, doc)=>{
					if (err) {
						log.error(`Creating Aldo product: ${err.message}`);
						return res.status(500).send(err);
					}
                    // Import images.
                    // log.debug(`req.body.dealerProductImagesLink: ${req.body.dealerProductImagesLink}`);
                    if (req.body.dealerProductImagesLink) {
                        let imagesLink = req.body.dealerProductImagesLink.split('__,__');
                        imageUtil.downloadImagesAndUpdateProduct(imagesLink, doc); 
                    }
					log.debug(`Product ${doc._id} was created by zunkasrv.`, doc._id);
					return res.send(doc._id);
				});
			}
		});
	} catch(err) {
		log.error(`Adding Aldo product: ${err.message}`);
		return res.status(500).send(err);
	}
});

// Update product price and av..
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
				log.error(`Updating product from service. Finding product ${req.body.storeProductPrice}. ${err.stack}`);
				return res.status(500).send(err);
			}
			// Product exist and not marked as deleted.
			if (product && !product.deletedAt) {
                product.dealerProductActive = req.body.dealerProductActive;
                if (!product.dealerProductActive) {
                    product.storeProductCommercialize = false
                } 
                product.dealerProductPrice = parseFloat(req.body.dealerProductPrice);
                if (product.dealerProductPrice === NaN || product.dealerProductPrice < 1000.00) {
			        return res.status(422).json({ erros: [ `dealerProductPrice: ${product.dealerProductPrice}, must be bigger than 1000.00`] });
                } else  {
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
				            log.error(`Updating product from service. Saving product _id: ${product.storeProductPrice}, dealerProductActive: ${product.dealerProductActive}, storeProductPrice: ${product.storeProductPrice}. ${err.stack}`);
                            return res.status(500).send(err);
                        }
                        log.debug(`Product was updated from service, _id: ${product._id}, dealerProductActive: ${product.dealerProductActive}, storeProductPrice: ${product.storeProductPrice}`);
                        return res.send(product._id);
                    });
                }
			} 
		});
	} catch(err) {
		log.error(`Updating product from service: ${err.stack}`);
		return res.status(500).send(err.message);
	}
});

module.exports = router;
