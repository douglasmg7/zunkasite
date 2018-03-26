'use strict';
const express = require('express');
const router = express.Router();
const mongo = require('../db/mongo');
const dbConfig = mongo.config;
const ObjectId = require('mongodb').ObjectId;
const log = require('../config/log');
// Models.
const Product = require('../model/product');
// const stringify = require('js-stringify')

// Format number to money format.
function formatMoney(val){
  return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Get all products.
router.get('/products', function(req, res, next) {
  req.query.search = req.query.search || '';
  // Get products.
  Product.find({}, (err, products)=>{
    // Internal error.
    if (err) { return next(err); }
    // Render.
    else { 
      res.render('admin/products', {
        user: req.isAuthenticated() ? req.user : { name: undefined, group: undefined },
        initSearch: req.query.search,
        products: products
      });
    }
  }) 
});

// Get a specific product.
router.get('/product/:product_id', function(req, res, next) {
  // Get product.
  Product.findById(req.params.product_id, (err, product)=>{
    // Internal error.
    if (err) { return next(err); }
    // Render.
    else { 
      console.log(product.storeProductId);
      res.render('admin/product', {
        user: req.isAuthenticated() ? req.user : { name: undefined, group: undefined },
        product: product
      });
    }
  }) 
});

module.exports = router;
