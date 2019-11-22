'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const marked = require('marked');
marked.setOptions({
    headerIds: false
});
const markdownCache = require('../model/markdownCache');
// Models.
const Product = require('../model/product');
// Redis.
const redis = require('../db/redis');
// Max product quantity by Page.
const PRODUCT_QTD_BY_PAGE  = 16;
// const stringify = require('js-stringify')

// Format number to money format.
function formatMoney(val){
	return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Error page.
router.get('/error', function(req, res, next) {
	// Render page.
	res.render('error/500', {
		nav: {
		},
	});
});

// // Get products page by class (news, more sold...).
// router.get('/full', function(req, res, next) {
	// redis.get('banners', (err, banners)=>{
		// // Internal error.
		// if (err) {
			// log.error(err.stack);
			// return res.render('/error', { message: 'Não foi possível encontrar os banners.', error: err });
		// }
		// // Render page.
		// return res.render('product/productListFull', {
			// nav: {
			// },
			// search: req.query.search ? req.query.search : '',
			// banners: JSON.parse(banners) || [],
		// });
	// });
// });

// Get products page by class (news, more sold...).
router.get('/', function(req, res, next) {
	redis.get('banners', (err, banners)=>{
		// Internal error.
		if (err) {
			log.error(err.stack);
			return res.render('/error', { message: 'Não foi possível encontrar os banners.', error: err });
		}
		// Render page.
        try {
            // log.debug(`user: ${JSON.stringify(res.locals, null, 2)}`);
            return res.render('product/productList', {
                nav: {
                },
                search: req.query.search ? req.query.search : '',
                banners: JSON.parse(banners) || [],
            });
        } catch(err){
            log.error(`Rendering product/productList. ${err.stack}`);
        }
	});
});

// Get all products page.
router.get('/all', function(req, res, next) {
	res.render('product/productListAll', {
		nav: {
		},
		search: req.query.search ? req.query.search : '',
		categoriesFilter: [],
	});
});

// Get all products page by categorie.
router.get('/all/:categoriesFilter', function(req, res, next) {
	res.render('product/productListAll', {
		nav: {
		},
		search: req.query.search ? req.query.search : '',
		categoriesFilter: [req.params.categoriesFilter],
	});
});

// Get product page.
router.get('/product/:_id', function(req, res, next) {
	Product.findById(req.params._id)
		.then(product=>{
			if (product._id) {
				// console.log(JSON.stringify(result));
                // console.log(`md: ${product.storeProductInfoMD}`);
                // console.log(`html: ${marked(product.storeProductInfoMD)}`);
                // Markdown text.
                let productInfo = '';
                if (product.storeProductInfoMD) {
                    productInfo = marked(replaceIncludeTokens(product.storeProductInfoMD));
                }
                // Warranty text.
                let warrantyText = '';
                if (product.includeWarrantyText) {
                    let markdownText = markdownCache.getCache().get('garantia');
                    if (markdownText) {
                        warrantyText = marked(markdownText);
                    }
                }
                // Outlet text.
                let outletText = '';
                if (product.includeOutletText) {
                    let markdownText = markdownCache.getCache().get('outlet');
                    if (markdownText) {
                        outletText = marked(markdownText);
                    }
                }
				res.render('product/product', {
					nav: {
					},
					product,
                    productInfo,
                    warrantyText,
                    outletText
				});
			} else {
				log.info(`product ${req.params._id} not found`);
				res.status(404).send('Produto não encontrado.');
			}
		}).catch(err=>{
			return next(err);
		});
});

// Replace include tokens.
function replaceIncludeTokens(text) {
    let lines = text.split("\n");
    let newLines = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('#include')) {
            let token = lines[i].split(" ")[1]
            lines[i] = markdownCache.getCache().get(token);
            // log.info(`token: ${token}`);
            // log.info(`token value: ${markdownCache.getCache().get(token)}`);
            if (lines[i]) {
                newLines.push(lines[i]);
                newLines.push('');
            }
        }
        else {
            newLines.push(lines[i]);
        }
    }
    return newLines.join('\r\n');
}

// Get products.
router.get('/api/products', function (req, res) {
	const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
	const skip = (page - 1) * PRODUCT_QTD_BY_PAGE;
	// log.debug(JSON.stringify(req.query.sort));
	// Not qtd 0.
    const search = {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
	// const search = {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductPrice': {$gt: 0}};
	// Text search.
	if (req.query.search) {
		search.storeProductTitle = {$regex: req.query.search, $options: 'i'};
	}
	// const search = req.query.search
	//   ? {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}, 'storeProductTitle': {$regex: req.query.search, $options: 'i'}}
	//   : {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
	// log.debug(JSON.stringify(req.query.categoriesFilter));
	// Categories search.
	if (req.query.categoriesFilter && req.query.categoriesFilter.length) {
		// log.debug(JSON.stringify(req.query.categoriesFilter.length));
		search.storeProductCategory = {$in: req.query.categoriesFilter};
	}
	// Sort.
	let sort = {storeProductQtd: -1, storeProductQtdSold: -1};
	switch(req.query.sort) {
		case 'alpha':
			sort = {storeProductTitle: 1};
			break
		case 'best-selling':
			sort = {storeProductQtdSold: -1};
			break;
		case 'price-low':
			sort = {storeProductPrice: 1};
			break;
		case 'price-high':
			sort = {storeProductPrice: -1};
			break;
	}
	// Find products.
	let productPromise = Product.find(search).sort(sort).skip(skip).limit(PRODUCT_QTD_BY_PAGE).exec();
	// let productPromise = Product.find(search).sort({'storeProductTitle': 1}).skip(skip).limit(PRODUCT_QTD_BY_PAGE).exec();
	// Product count.
	let productCountPromise = Product.countDocuments(search).exec();
	Promise.all([productPromise, productCountPromise])
		.then(([products, count])=>{
			res.json({products, page, pageCount: Math.ceil(count / PRODUCT_QTD_BY_PAGE), categories: res.locals.categoriesInUse});
		}).catch(err=>{
			return next(err);
		});
});

// Get news products.
router.get('/api/new-products', function (req, res) {
	const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
	// const skip = (page - 1) * PRODUCT_QTD_BY_PAGE;
	const search = {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
	// Find products.
	let productPromise = Product.find(search).sort({'createdAt': -1}).limit(6).exec();
	Promise.all([productPromise])
		.then(([products])=>{
			res.json({products});
		}).catch(err=>{
			return next(err);
		});
});

// Get best selling products.
router.get('/api/best-selling-products', function (req, res) {
	const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
	// const skip = (page - 1) * PRODUCT_QTD_BY_PAGE;
    const search = {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
    // const search = {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductQtdSold': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
	// Find products.
	// let productPromise = Product.find(search).sort({'createdAt': -1}).limit(4).exec();
	let productPromise = Product.find(search).sort({'storeProductQtdSold': -1, 'storeProductQtd': 1}).limit(6).exec();
	Promise.all([productPromise])
		.then(([products])=>{
			res.json({products});
		}).catch(err=>{
			return next(err);
		});
});

// Get product by id.
router.get('/api/product/:_id', function(req, res, next) {
	Product.findById(req.params._id)
		.then(product=>{
			if (product._id) {
				res.json({product});
			} else {
				log.info(`product ${req.params._id} not found`);
				res.status(404).send('Produto não encontrado.');
			}
		}).catch(err=>{
			return next(err);
		});
});

// Cart page.
router.get('/cart', (req, res, next)=>{
	// log.info('req.session', JSON.stringify(req.session));
	req.cart.update(err=>{
		if (err) {
			log.error(err.stack);
			return next(err);
		}
		res.render('user/cart', {
			nav: {},
			user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined },
			cart: req.cart,
			formatMoney: formatMoney
		});
	});
})

// Add product to cart.
router.put('/cart/add/:_id', (req, res, next)=>{
	// Get product from db.
	Product.findById(req.params._id)
		.then(product=>{
			if (product._id) {
				req.cart.addProduct(product, ()=>{
					// console.log('user cart', JSON.stringify(user.cart));
					res.json({success: true});
				});
				// Not exist the product.
			} else {
				log.error(new Error(`product ${req.params._id} not found to add to cart.`).stack);
				res.status(404).send('Produto não encontrado na base de dados.');
			}
		}).catch(err=>{
			log.error(err.stack);
			res.status(404).send('Produto não encontrado na base de dados.');
		});
})

// Change product quantity from cart.
router.put('/cart/change-qtd/:_id/:qtd', (req, res, next)=>{
	req.cart.changeProductQtd(req.params._id, req.params.qtd, (err)=>{
		if (err) {
			log.error(err.stack);
			return res.json({ success: false });
		}
		res.json({success: true, cart: req.cart});
	});
})

// Remove product from cart.
router.put('/cart/remove/:_id', (req, res, next)=>{
	req.cart.removeProduct(req.params._id, ()=>{
		res.json({success: true, cart: req.cart});
	});
})

// Change product quantity from cart.
router.post('/cart/clean-alert-msg', (req, res, next)=>{
	req.cart.cleanAlertMsg(()=>{
		res.json({success: true, cart: req.cart});
	});
})

// Get product list.
module.exports = router;
