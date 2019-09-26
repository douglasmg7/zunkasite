'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const { check, validationResult } = require('express-validator/check');

const Product = require('../model/product');

// Add product.
router.post('/product/add', [
		check('dealerName').isLength(4, 20),
		check('dealerProductId').isLength(1, 20),
		check('dealerProductTitle').isLength(4, 200),
		check('dealerProductDesc').isLength(4, 6000),
		check('dealerProductBrand').isLength(4, 200),
		check('dealerProductWarrantyDays').isNumeric(),
		check('dealerProductDeep').isNumeric(),
		check('dealerProductHeight').isNumeric(),
		check('dealerProductWidth').isNumeric(),
		check('dealerProductWeight').isNumeric(),
		check('dealerProductActive').isBoolean(),
		check('dealerProductPrice').isNumeric(),
		check('dealerProductLastUpdate').isISO8601(),
], (req, res, next)=>{
	try {
		// log.debug(JSON.stringify(req.body, null, 3));
		// Check erros.
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// log.debug(JSON.stringify(errors.array(), null, 2));
			return res.status(422).json({ erros: errors.array() });
		}
		// Create product.
		let product = {};
		product.dealerName = req.body.dealerName;
		product.dealerProductId = req.body.dealerProductId;
		product.dealerProductTitle = req.body.dealerProductTitle;
		product.dealerProductBrand = req.body.dealerProductBrand;
		product.dealerProductWarrantDays = req.body.dealerProductWarrantDays;
		product.dealerProductDeep = req.body.dealerProductDeep;
		product.dealerProductHeight = req.body.dealerProductHeight;
		product.dealerProductWidth = req.body.dealerProductWidth;
		product.dealerProductWeight = req.body.dealerProductWeight;
		product.dealerProductPrice = req.body.dealerProductPrice;
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
				product.storeProductDescription = product.dealerProductDesc;
				product.storeProductDetail = "";
				product.storeProductTechnicalInformation = "";
				product.storeProductAdditionalInformation = "";
				product.storeProductMaker = "";
				product.storeProductCategory = "";
				product.storeProductLength = product.dealerProductDeep;
				product.storeProductHeight = product.dealerProductHeight;
				product.storeProductWidth = product.dealerProductWidth;
				product.storeProductWeight = product.dealerProductWeight;
				product.storeProductPrice =  (product.dealerProductPrice * 1.3) / 100;
				product.storeProductCommercialize = false;
				product.storeProductMarkup = 30;
				product.storeProductDiscountEnable = false;
				product.storeProductDiscountType = "%";
				product.storeProductDiscountValue = 5;
				product.storeProductWarrantyDays = 0;
				product.storeProductWarrantyDetail = "";
				product.storeProductQtdSold = 0;
				// Must be verified on aldo ws before close order.
				product.storeProductQtd = 1;
				product.storeProductActive = false;
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

		// // Save product.
		// Product.findOneAndUpdate({dealerName: product.dealerName, dealerProductId: product.dealerProductId}, product, {upsert: true, new: true}, (err, doc)=>{
			// if (err) {
				// log.error(`Adding Aldo product: ${err.message}`);
				// return res.status(500).send(err);
			// }
			// log.debug(`product id: ${doc._id}`);
			// res.json(' success: true ');
		// });
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

module.exports = router;
