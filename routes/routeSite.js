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
    cart: req.session.cart || { products: [], qtd: 0 },
    formatMoney: formatMoney
  });
})

// Add product to cart.
router.put('/cart/add/:_id', (req, res, next)=>{
  // console.log('sessionID: ', req.sessionID);
  // console.log('session: ', req.session);
  // console.log('user: ', req.user);

  // If no user logged, use the session.
  // let user = req.user || req.session;
  let user = req.session;      
  // Get product from db.
  let _id = new ObjectId(req.params._id);
  mongo.db.collection(dbConfig.collStoreProducts).findOne({_id: _id})
  .then(result=>{
    // Product exist.
    if (result._id) {
      let product = result;
      // Create cart.
      if (!user.cart) {
        user.cart = {products: [], totalQtd: 0, totalPrice: 0};
      }
      // Product alredy in cart, add more one.
      let prodctFound = false;
      for (var i = 0; i < user.cart.products.length; i++) {
        if (user.cart.products[i]._id == product._id){
          // Add quantity.
          user.cart.products[i].qtd++;
          // Update price.
          user.cart.products[i].price = product.storeProductPrice;
          prodctFound = true;
          break;
        }        
      }
      // Product not in the cart, add it.
      if (!prodctFound) {
        // Find first image selected.
        let image;
        for (var i = 0; i < product.images.length; i++) {
          if (product.images[i].selected) {
            image = product.images[i].name;
            break;
          }
        }
        user.cart.products.push({_id: product._id, qtd: 1, title: product.storeProductTitle, price: product.storeProductPrice, image: image});
      }
      // Calculate products total quantity and price.
      user.cart.totalQtd = 0;
      user.cart.totalPrice = 0;
      user.cart.products.forEach(function(product) {
        user.cart.totalQtd += product.qtd;
        user.cart.totalPrice += (product.price * product.qtd);
      });
      // console.log('user cart', JSON.stringify(user.cart));
      res.json({seccess: true});      
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
})

// Remove product from cart.
router.put('/cart/remove/:_id', (req, res, next)=>{
  // If no user logged, use the session.
  // let user = req.user || req.session;
  let user = req.session;
  // Find product into cart and remove it.
  if (user.cart) {
    for (var i = 0; i  < user.cart.products.length; i++) {
      if (user.cart.products[i]._id = req.params._id) {
        user.cart.products.splice(i, 1);
        break;
      }
    }
  }
  // Calculate products total quantity and price.
  user.cart.totalQtd = 0;
  user.cart.totalPrice = 0;
  user.cart.products.forEach(function(product) {
    user.cart.totalQtd += product.qtd;
    user.cart.totalPrice += product.price;
  });
  res.json({success: true, msg: 'Product removed', productRemovedId: req.params._id, cart: user.cart});
})

// Delete cart (development).
router.put('/delete-cart', (req, res, next)=>{
  console.log('cart');
  // If no user logged, use the session.
  // let user = req.user || req.session;
  let user = req.session;
  // Create cart.
  if (user.cart) {
    delete user.cart;
  }
  res.json({seccess: true});
})

module.exports = router;
