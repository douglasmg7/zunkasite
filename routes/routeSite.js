const express = require('express');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = mongo.config;
const ObjectId = require('mongodb').ObjectId;
const log = require('../bin/log');
// const stringify = require('js-stringify')

// Index.
router.get('/', function(req, res, next) {
  req.query.search = req.query.search || '';
  // console.log(`search: ${req.query.search}`);
  // console.log(`cookies: ${JSON.stringify(req.cookies)}`);
  // log.verbose(`get / - req.user: ${JSON.stringify(req.user)}`);
  // log.verbose(`get / - req.isAuthenticated(): ${req.isAuthenticated()}`);
  // res.render('store', {initSearch: req.query.search});
  res.render('store', {
    user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined },
    initSearch: req.query.search
  });
});

// Get a specific product.
router.get('/product/:_id', function(req, res, next) {
  // Mongodb formated _id product.
  let _id;
  try {
    _id = new ObjectId(req.params._id);
  } catch (e) {
    res.status(404).send('Produto não encontrado.');
    console.log(`error creating mongo ObjectId, error: ${e}`);
    return;
  }
  // Get product from db.
  mongo.db.collection(dbConfig.collStoreProducts).findOne({_id: _id})
  .then(result=>{
    // Product exist.
    if (result._id) {
      // console.log(JSON.stringify(result));
      res.render('storeItem', {
        user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined },
        product: result
      });
    // Not exist the product.
    } else {
      console.log(`product ${req.params._id} not found`);
      res.status(404).send('Produto não encontrado.');
    }
  })
  .catch((err)=>{
    console.log(`error getting product from db, _id: ${req.params._id}, err: ${err}`);
    res.status(404).send('Produto não encontrado.');
  });
});

// Cart page.
router.get('/cart', (req, res, next)=>{
  res.render('cart', {
    user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined },
    cart: req.session.cart || { products: [], qtd: 0 }
  });
})

// Add product to cart.
router.put('/cart/add/:product_id', (req, res, next)=>{
  console.log('cart');
  // console.log('sessionID: ', req.sessionID);
  // console.log('session: ', req.session);
  // console.log('user: ', req.user);

  let product;
  // Get product from db.
  mongo.db.collection(dbConfig.collStoreProducts).findOne({_id: _id})
  .then(result=>{
    // Product exist.
    if (result._id) {
      product = result;
    // Not exist the product.
    } else {
      log.error(`product ${req.params._id} not found to add to cart.`);
      res.status(404).send('Produto não encontrado na base de dados.');
    }
  })
  .catch((err)=>{
    console.log(err, new Error().stack);
    res.status(404).send('Produto não encontrado na base de dados.');
  });

  // If no user logged, use the session.
  // let user = req.user || req.session;
  let user = req.session;
  // Create cart.
  if (!user.cart) {
    user.cart = {products: [], totalQtd: 0, totalPrice: 0};
  }
  // If product alredy on cart, add more one.
  let prodctFound = false;
  user.cart.products.forEach(function(product) {
    if (product._id === req.params.product_id){
      product.qtd++;
      prodctFound = true;
    }
  });
  // Product not in the cart yet, add!
  if (!prodctFound) {
    user.cart.products.push({_id: req.params.product_id, qtd: 1, title: product.storeProductTitle, price: product.storePorductPrice});
  }
  // Calculate products total quantity and price.
  user.cart.totalQtd = 0;
  user.cart.products.forEach(function(product) {
    user.cart.totalQtd += product.qtd;
    user.cart.totalPrice += product.price;
  });
  // console.log('user cart', JSON.stringify(user.cart));
  res.json({seccess: true});
})

module.exports = router;
