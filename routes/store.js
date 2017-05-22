const express = require('express');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = mongo.config;
const ObjectId = require('mongodb').ObjectId;
// index
router.get('/', function(req, res, next) {
  req.query.search = req.query.search || '';
  console.log(`search: ${req.query.search}`);
  // res.render('store', {initSearch: req.query.search});
  res.render('store', {title: 'Produtos da loja', initSearch: req.query.search});
});
// get a specific product
router.get('/product/:_id', function(req, res, next) {
  // mongodb formated _id product
  let _id;
  try {
    _id = new ObjectId(req.params._id);
  } catch (e) {
    res.status(404).send('Produto não encontrado.');
    console.log(`error creating mongo ObjectId, error: ${e}`);
    return;
  }
  // get product from db
  mongo.db.collection(dbConfig.collStoreProducts).findOne({_id: _id})
  .then(result=>{
    // product exist
    if (result._id) {
      // console.log(JSON.stringify(result));
      res.render('storeItem', {product: result});
    // not exist product
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
