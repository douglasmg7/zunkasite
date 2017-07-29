const express = require('express');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = mongo.config;
const ObjectId = require('mongodb').ObjectId;
const log = require('../bin/log');
// const stringify = require('js-stringify')

// Format number to money format.
function formatMoney(val){
  return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Index.
router.get('/', function(req, res, next) {
  req.query.search = req.query.search || '';
  // Last product added to cart.
  // log.info('req.user: ', JSON.stringify(req.user));
  // log.info('req.isAuthenticated(): ', JSON.stringify(req.isAuthenticated()));
  // log.info('req.session', JSON.stringify(req.session));
  res.render('store', {
    user: req.isAuthenticated() ? req.user : { name: undefined, group: undefined },
    cart: req.cart,
    initSearch: req.query.search,
    productAdded: null
  });
});

// Index.
router.get('/last-product-added-to-cart/:_id', function(req, res, next) {
  req.query.search = req.query.search || '';
  // Mongodb formated _id product.
  let _id;
  try {
    _id = new ObjectId(req.params._id);
  } catch (e) {
    res.status(404).send('Produto não encontrado.');
    console.log(`error creating mongo ObjectId, error: ${e}`);
    return;
  }
  // Get last product added to from db.
  mongo.db.collection(dbConfig.collStoreProducts).findOne({_id: _id})
    .then(product=>{
      // Product exist.
      if (product._id) {
        // First image selected to use.
        let image;
        for (var i = 0; i < product.images.length; i++) {
          if (product.images[i].selected) {
            image = product.images[i].name;
            break;
          }
        }
        res.render('store', {
          user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined },
          cart: req.cart,
          initSearch: req.query.search,
          productAdded: {image: `/img/${product._id}/${image}`}
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
        cart: req.cart,
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
  // log.info('req.session', JSON.stringify(req.session));
  res.render('cart', {
    user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined },
    cart: req.cart,
    formatMoney: formatMoney
  });
})

// Add product to cart.
router.put('/cart/add/:_id', (req, res, next)=>{
  // Get product from db.
  let _id = new ObjectId(req.params._id);
  mongo.db.collection(dbConfig.collStoreProducts).findOne({_id: _id})
  .then(product=>{
    // Product exist.
    if (product._id) {
      req.cart.addProduct(product);
      // console.log('user cart', JSON.stringify(user.cart));
      res.json({success: true});      
    // Not exist the product.
    } else {
      log.error(`product ${req.params._id} not found to add to cart.`);
      res.status(404).send('Produto não encontrado na base de dados.');
    }
  })
  .catch((err)=>{
    log.error(err, new Error().stack);
    res.status(404).send('Produto não encontrado na base de dados.');
  });
})

// Change product quantity from cart.
router.put('/cart/change-qtd/:_id/:qtd', (req, res, next)=>{
  req.cart.changeProductQtd(req.params._id, req.params.qtd)
  res.json({success: true, msg: 'Product quantity changed', productQtdChanged: req.params._id, cart: req.cart});
})

// Remove product from cart.
router.put('/cart/remove/:_id', (req, res, next)=>{
  req.cart.removeProduct(req.params._id);
  res.json({success: true, msg: 'Product removed', productRemovedId: req.params._id, cart: req.cart});
})

module.exports = router;
