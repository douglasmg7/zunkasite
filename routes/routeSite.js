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

module.exports = router;
