'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const { check, validationResult } = require('express-validator/check');

const Product = require('../model/product');



// Add product.
router.post('/product/add', [
		check('dealerName').isLength({ min: 5 })
], (req, res, next)=>{
	log.debug(JSON.stringify(req.body, null, 3));

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		log.debug('erro!');
		return res.status(422).json({ errors: errors.array() });
	}

	let product = new Product();
	// Dealer name.
	product.dealerName = req.body.dealerName;


	log.debug(`product: ${JSON.stringify(product)}`);
	res.json(' success: true ');

		
	// res.render('producstoretsStore', { user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined }, csrfToken: req.csrfToken() });
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
