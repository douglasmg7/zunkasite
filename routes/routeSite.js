'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const mongoose = require('mongoose');
// Models.
const Product = require('../model/product');
// Max product quantity by Page.
const PRODUCT_QTD_BY_PAGE  = 10;
// const stringify = require('js-stringify')

// Format number to money format.
function formatMoney(val){
  return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Get products page.
router.get('/', function(req, res, next) {
  res.render('productList', {
    nav: {
    },
    search: req.query.search ? req.query.search : '',
  });   
});

// Get product page.
router.get('/product/:_id', function(req, res, next) {
  Product.findById(req.params._id)
  .then(product=>{
    if (product._id) {
      // console.log(JSON.stringify(result));
      res.render('product', {
        nav: {
        },
        product
      });
    } else {
      log.info(`product ${req.params._id} not found`);
      res.status(404).send('Produto não encontrado.');      
    }
  }).catch(err=>{
    return next(err);
  });  
});

// Get products.
router.get('/api/products', function (req, res) {
  const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
  const skip = (page - 1) * PRODUCT_QTD_BY_PAGE;
  const search = req.query.search
    ? {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductPrice': {$gt: 0}, 'storeProductTitle': {$regex: req.query.search, $options: 'i'}}
    : {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductPrice': {$gt: 0}};    
  // Find products.
  let productPromise = Product.find(search).sort({'storeProductTitle': 1}).skip(skip).limit(PRODUCT_QTD_BY_PAGE).exec();
  // Product count.
  let productCountPromise = Product.count(search).exec();
  Promise.all([productPromise, productCountPromise])
  .then(([products, count])=>{    
    res.json({products, page, pageCount: Math.ceil(count / PRODUCT_QTD_BY_PAGE)});
  }).catch(err=>{
    return next(err);
  });
});

// Get product.
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
  updateCart(req.cart, err=>{
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

// Update cart with new prices and remove itens out of stock.
function updateCart(cart, cb){
  let productsId = [];
  // Get all products on cart.
  for (var i = 0; i < cart.products.length; i++) {
    productsId.push(mongoose.Types.ObjectId(cart.products[i]._id));
  }
  // Get all products into cart from db.
  Product.find({'_id': { $in: productsId }}, (err, products)=>{
    if (err) {
      return cb(err);
    }
    // Map to product object to id.
    let productsDbMap = new Map();
    for (var i = 0; i < products.length; i++) {
      productsDbMap.set(products[i]._id.toString(), products[i]);
    }
    // Verify itens with diferent price and out of stock.
    for (var i = 0; i < cart.products.length; i++) {
      let cartProduct = cart.products[i];
      let dbProduct = productsDbMap.get(cartProduct._id);
      // Different prices.
      if (cartProduct.price !== dbProduct.storeProductPrice) {
        log.debug(`Cart product: R$${cartProduct.price} and db product: R$${dbProduct.storeProductPrice} have different prices.`);
      }
      if (dbProduct.dealerProductQtd < cartProduct.qtd) {
        log.debug(`Product db: ${dbProduct._id} out of stock.`);
      }
    }
    cb(null);
  });
}

// Add product to cart.
router.put('/cart/add/:_id', (req, res, next)=>{
  // Get product from db.
  Product.findById(req.params._id)
  .then(product=>{
    if (product._id) {
      req.cart.addProduct(product);
      // console.log('user cart', JSON.stringify(user.cart));
      res.json({success: true});      
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
  req.cart.changeProductQtd(req.params._id, req.params.qtd, ()=>{
    res.json({success: true, cart: req.cart});
  });
})

// Remove product from cart.
router.put('/cart/remove/:_id', (req, res, next)=>{
  req.cart.removeProduct(req.params._id, ()=>{
    res.json({success: true, cart: req.cart});
  });
})

module.exports = router;
