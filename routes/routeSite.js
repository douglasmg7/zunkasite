'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const axios = require('axios');
const s = require('../config/s');
const aldo = require('../util/aldo');
const allnations = require('../util/allnations.js');
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
    if(!req.params._id.match(/^[a-f\d]{24}$/)){
        return res.status(400).send(`produto "${req.params._id}" inválido.`);
    }
	Product.findById(req.params._id)
		.then(product=>{
			if (product._id && product.storeProductCommercialize) {
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
                if (product.warrantyMarkdownName) {
                    let markdownText = markdownCache.getCache().get(`garantia-${product.warrantyMarkdownName}`);
                    if (markdownText) {
                        warrantyText = marked(markdownText);
                    }
                }
                // Deprecatead - begin.
                else if (product.includeWarrantyText) {
                    let markdownText = markdownCache.getCache().get('garantia');
                    if (markdownText) {
                        warrantyText = marked(markdownText);
                    }
                }
                // Deprecatead - end.
                // Outlet text.
                let outletText = '';
                if (product.includeOutletText) {
                    let markdownText = markdownCache.getCache().get('outlet');
                    if (markdownText) {
                        outletText = marked(markdownText);
                    }
                }
                // Additional information.
                let additionalInformation = '';
                if (product.storeProductAdditionalInformation.trim()) {
                    additionalInformation = marked(replaceIncludeTokens(product.storeProductAdditionalInformation));
                }
				res.render('product/product', {
					nav: {
					},
					product,
                    productInfo,
                    warrantyText,
                    outletText,
                    additionalInformation
				});
			} else {
				log.debug(`product ${req.params._id} not found`);
				res.status(404).send('Produto não existe.');
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
    // const search = {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
    // const search = {'deletedAt': {$exists: false}, 'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductPrice': {$gt: 0}};
    const search = {
        $nor: [
            { $and: [
                { 'dealerName': {$eq: 'Aldo'} }, 
                { 'storeProductQtd': {$eq: 0} }
            ] },
            { $and: [
                { 'dealerName': {$eq: 'Allnations'} }, 
                { 'storeProductQtd': {$eq: 0} }
            ] }
        ], 
        'deletedAt': {$exists: false}, 
        'storeProductCommercialize': true, 
        'storeProductTitle': {$regex: /\S/}, 
        'storeProductPrice': {$gt: 0}
    };
    // db.products.find({$nor:[ {$and: [{dealerName: {$eq: "Aldo"}}, {storeProductQtd: {$eq: 0}}]} ]},{ _id: false, dealerName: true, storeProductQtd: true });

	// Text search.
	if (req.query.search) {
		search.storeProductTitle = {$regex: req.query.search, $options: 'i'};
	}
    // Not show product out of stock when sorting.
	if (req.query.sort !== "stock") {
        // log.debug(`req.query.sort:  ${req.query.sort}`);
		search.storeProductQtd = { $gt: 0 };
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
	let sort = {displayPriority: 1, storeProductQtd: -1, storeProductQtdSold: -1};
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
	const search = {'deletedAt': {$exists: false}, 'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
	// Find products.
	// let productPromise = Product.find(search).sort({'createdAt': -1}).limit(6).exec();
	// let productPromise = Product.find(search).sort({'updatedAt': -1}).limit(6).exec();
	let productPromise = Product.find(search).sort({'editedAt': -1}).limit(6).exec();
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
    const search = {'deletedAt': {$exists: false}, 'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
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
			if (product._id && product.storeProductCommercialize) {
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
        if (product._id && product.storeProductCommercialize) {
            // For Aldo products, test if product in stock.
            if (product.dealerName == "Aldo") {
                aldo.checkAldoProductQty(product, 1, (err, productInStock)=>{
                    // log.debug(`productInStock: ${productInStock}`);
                    if (err) {
                        log.error(new Error(`Adding aldo product to cart. Product ${req.params._id}. ${err.stack}`).stack);
                        return res.json({success: false, outOfStock: false, message: "Não foi possível adicionar o produto ao carrinho.\nAlguma coisa deu errado na solicitação de sua requisição."});
                    }
                    // Into stock.
                    else if (productInStock) {
                        // Add product to cart.
                        req.cart.addProduct(product, ()=>{
                            // console.log('user cart', JSON.stringify(user.cart));
                            return res.json({success: true});
                        });
                    // Out of stock.
                    } else {
                        return res.json({success: false, outOfStock: true, message: "Não foi possível adicionar o produto ao carrinho.\nNossa última unidade acabou de ser vendida."});
                    }
                });
            }
            else if (product.dealerName == "Allnations") {
                allnations.checkStock(product, 1, (err, productInStock)=>{
                    // log.debug(`productInStock: ${productInStock}`);
                    if (err) {
                        log.error(new Error(`Adding allnations product to cart. Product ${req.params._id}. ${err.stack}`).stack);
                        return res.json({success: false, outOfStock: false, message: "Não foi possível adicionar o produto ao carrinho.\nAlguma coisa deu errado na solicitação de sua requisição."});
                    }
                    // Into stock.
                    else if (productInStock) {
                        // Add product to cart.
                        req.cart.addProduct(product, ()=>{
                            // console.log('user cart', JSON.stringify(user.cart));
                            return res.json({success: true});
                        });
                    // Out of stock.
                    } else {
                        return res.json({success: false, outOfStock: true, message: "Não foi possível adicionar o produto ao carrinho.\nNossa última unidade acabou de ser vendida."});
                    }
                });
            }
            // Zunka in stock products.
            else {
                // Add product to cart.
                req.cart.addProduct(product, ()=>{
                    // console.log('user cart', JSON.stringify(user.cart));
                    return res.json({success: true});
                });
            }
        // Product not exist.
        } else {
            log.error(new Error(`Adding product to cart. Product ${req.params._id} not found on db.`).stack);
            return res.json({success: false, outOfStock: false, message: "Não foi possível adicionar o produto ao carrinho.\nAlguma coisa deu errado na solicitação de sua requisição."});
        }
    }).catch(err=>{
        log.error(new Error(`Adding product to cart. Product ${req.params._id}. catch err. ${err.stack}`).stack);
        // log.error(new Error(`Adding product to cart. Product ${req.params._id}. catch err. ${err.stack}`).stack);
        return res.json({success: false, outOfStock: false, message: "Não foi possível adicionar o produto ao carrinho.\nAlguma coisa deu errado na solicitação de sua requisição."});
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

// Address by CEP.
router.get('/address-by-cep/:cep', (req, res, next)=>{
    // console.log(`req.params: ${JSON.stringify(req.params, null, 2)}`);
    let cep = req.params.cep;
    if (cep.match(/^\d{5}-?\d{3}$/)) {
        axios.get(`${s.freightServer.host}/address`, {
            headers: {
                "Accept": "application/json", 
            },
            auth: { 
                username: s.freightServer.user, 
                password: s.freightServer.password
            },
            data: cep
        })
        .then(response => {
            // log.debug(`response.data: ${JSON.stringify(response.data, null, 2)}`);
            res.json({ address: response.data });
        })
        .catch(err => {
            log.error(`Getting address for CEP ${cep}. ${err.stack}`);
            return res.status(500).send()
        }); 
    } else {
        return res.json({ error: `CEP ${cep} inválido` });
    }
});

// Get product list.
module.exports = router;
