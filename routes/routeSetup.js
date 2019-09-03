'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');

// Get Product.
router.post('/product/add', (req, res, next)=>{
	log.debug(JSON.stringify(req.body, null, 3));
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
