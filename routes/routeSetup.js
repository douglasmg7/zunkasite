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
		check('dealerProductDesc').isLength(4, 2000),
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
	// log.debug(JSON.stringify(req.body, null, 3));
	// Check erros.
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		// log.debug(JSON.stringify(errors.array(), null, 2));
		return res.status(422).json({ erros: errors.array() });
	}
	// Create product.
	let product = new Product();
	product.dealerName = req.body.dealerName;
	product.dealerProductId = req.body.dealerProductId;
	product.dealerProductTitle = req.body.dealerProductTitle;
	product.dealerProductDesc = req.body.dealerProductDesc;
	product.dealerProductBrand = req.body.dealerProductBrand;
	product.dealerProductWarrantDays = req.body.dealerProductWarrantDays;
	product.dealerProductDeep = req.body.dealerProductDeep;
	product.dealerProductHeight = req.body.dealerProductHeight;
	product.dealerProductWidth = req.body.dealerProductWidth;
	product.dealerProductWeight = req.body.dealerProductWeight;
	product.dealerProductActive = req.body.dealerProductActive;
	product.dealerProductPrice = req.body.dealerProductPrice;
	product.dealerProductLastUpdate = req.body.dealerProductLastUpdate;
	log.debug(`product: ${JSON.stringify(product, null, 2)}`);
	// Save product.
	product.save(err=>{
		if (err) {
			return res.status(500).send(err);
		}
	});
	res.json(' success: true ');
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
