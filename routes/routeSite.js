'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
// Models.
const Product = require('../model/product');
// Redis.
const redis = require('../db/redis');
// Max product quantity by Page.
const PRODUCT_QTD_BY_PAGE  = 10;
// const stringify = require('js-stringify')

// Format number to money format.
function formatMoney(val){
  return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Get products page by class (news, more selled...).
router.get('/', function(req, res, next) {
  redis.get('banners', (err, banners)=>{
    // Internal error.
    if (err) { 
      log.error(err.stack);
      return res.render('/error', { message: 'Não foi possível encontrar os banners.', error: err });
    } 
    // Render page.  
    return res.render('product/productList', {
      nav: {
      },
      search: req.query.search ? req.query.search : '',
      banners: JSON.parse(banners) || [],
    }); 
  }); 
});

// Get products page.
router.get('/search', function(req, res, next) {
  res.render('product/productListSearch', {
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
      res.render('product/product', {
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
    ? {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}, 'storeProductTitle': {$regex: req.query.search, $options: 'i'}}
    : {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}};    
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

// Get news products.
router.get('/api/new-products', function (req, res) {
  const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
  const skip = (page - 1) * PRODUCT_QTD_BY_PAGE;
  const search = {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
  // Find products.
  let productPromise = Product.find(search).sort({'createdAt': -1}).limit(4).exec();
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
  const skip = (page - 1) * PRODUCT_QTD_BY_PAGE;
  const search = {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
  // const search = {'storeProductCommercialize': true, 'storeProductTitle': {$regex: /\S/}, 'storeProductQtd': {$gt: 0}, 'storeProductQtdSold': {$gt: 0}, 'storeProductPrice': {$gt: 0}};
  // Find products.
  // let productPromise = Product.find(search).sort({'createdAt': -1}).limit(4).exec();
  let productPromise = Product.find(search).sort({'storeProductQtdSold': -1, 'storeProductQtd': 1}).limit(4).exec();
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
