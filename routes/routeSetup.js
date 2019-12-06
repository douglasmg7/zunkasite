'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const s = require('../config/s');
const { check, validationResult } = require('express-validator/check');
// Models.
const Product = require('../model/product');
// Utils.
const categories = require('../util/productCategories');
const makers = require('../util/productMakers.js');
const turndown = new require('turndown')();

// Add product.
router.post('/product/add', basicAuth, [
		check('dealerName').isLength(4, 20),
		check('dealerProductId').isLength(1, 20),
		check('dealerProductTitle').isLength(4, 200),
		check('dealerProductDesc').isLength(4, 6000),
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
			// Product alredy exist.
			if (doc) {
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
				product.storeProductQtd = 4;
				product.storeProductActive = product.dealerProductActive;
				let newProduct = new Product(product);
				newProduct.save((err, doc)=>{
					if (err) {
						log.error(`Creating Aldo product: ${err.message}`);
						return res.status(500).send(err);
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

// // Store products.
// router.get('/store', checkPermission, (req, res, next)=>{
// res.render('productsStore', { user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined }, csrfToken: req.csrfToken() });
// });

// // All nations products.
// router.get('/allnations', checkPermission, (req, res, next)=>{
// res.render('productsAllNations', { user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined } });
// });

// Check permission.
function checkPermission (req, res, next) {
	// Should be admin.
	if (req.isAuthenticated() && req.user.group.includes('admin')) {
		return next();
	}
	res.redirect('/');
}

// Basic authentification for api access.
function basicAuth(req, res, next) {
    // Check for basic auth header.
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).send('Missing Authorization Header');
    }
    // Verify auth credentials.
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [user, pass] = credentials.split(':');
	if (user === s.zunkaSite.user && pass === s.zunkaSite.password) {
		next();
	} else { 
        return res.status(401).send('Unauthorised.\n');
	}
}

module.exports = router;
