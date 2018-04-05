'use strict';
const express = require('express');
const router = express.Router();
const mongo = require('../db/mongo');
const dbConfig = mongo.config;
const ObjectId = require('mongodb').ObjectId;
const log = require('../config/log');
// Models.
const Product = require('../model/product');
const ProductMaker = require('../model/productMaker');
const ProductCategorie = require('../model/productCategorie');
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

  let queryProduct = Product.findById(req.params.product_id);
  let queryProductMaker = ProductMaker.find();
  let queryProductCategorie = ProductCategorie.find();

  Promise.all([queryProduct, queryProductMaker, queryProductCategorie])
  .then(([product, productMakers, productCategories])=>{
    // console.log(product.storeProductCategory);
    res.render('admin/product', {
      user: req.isAuthenticated() ? req.user : { name: undefined, group: undefined },
      product: product,
      productMakers: productMakers,
      productCategories: productCategories
    });
  }).catch(err=>{
    console.log(`Error getting data, err: ${err}`);
  });

  // // Get product.
  // Product.findById(req.params.product_id, (err, product)=>{
  //   // Internal error.
  //   if (err) { return next(err); }
  //   // Render.
  //   else { 
  //     res.render('admin/product', {
  //       user: req.isAuthenticated() ? req.user : { name: undefined, group: undefined },
  //       product: product
  //     });
  //   }
  // }) 

});

module.exports = router;
