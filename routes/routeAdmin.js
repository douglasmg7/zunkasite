'use strict';
const express = require('express');
const router = express.Router();
const mongo = require('../db/mongo');
const dbConfig = mongo.config;
const ObjectId = require('mongodb').ObjectId;
const log = require('../config/log');
const path = require('path');
const fse = require('fs-extra');
// File upload.
const formidable = require('formidable');
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
      csrfToken: req.csrfToken(),
      product: product,
      productMakers: productMakers,
      productCategories: productCategories
    });
  }).catch(err=>{
    console.log(`Error getting data, err: ${err}`);
  });

  // Upload product pictures.
  router.put('/upload-product-images/:_id', checkPermission, (req, res)=>{
    const form = formidable.IncomingForm();
    const DIR_IMG_PRODUCT = path.join(__dirname, '..', 'dist/img/', req.params._id);
    const MAX_FILE_SIZE_UPLOAD = 10 * 1024 * 1024;
    form.uploadDir = DIR_IMG_PRODUCT;
    form.keepExtensions = true;
    form.multiples = true;
    form.imageNames = [];
    // Verifiy file size.
    form.on('fileBegin', function(name, file){
      if (form.bytesExpected > MAX_FILE_SIZE_UPLOAD) {
        this.emit('error', `"${file.name}" too big (${(form.bytesExpected / (1024 * 1024)).toFixed(1)}mb)`);
      }
    });
    // Received name and file.
    form.on('file', function(name, file) {
      log.info(`"${file.name}" uploaded to "${file.path}"`);
      form.imageNames.push(path.basename(file.path));
    });
    // Err.
    form.on('error', function(err) {
      log.error(`error uploading file: ${err}`);
      res.writeHead(413, {'connection': 'close', 'content-type': 'text/plain'});
      res.end(err);
      req.connection.destroy();
    });
    // All files have been uploaded.
    form.on('end', function() {
      res.json({imageNames: form.imageNames});
    });
    // Create folder if not exist and start upload.
    fse.ensureDir(DIR_IMG_PRODUCT, err=>{
      // Other erro than file alredy exist.
      if (err && err.code !== 'EEXIST') {
        log.error(`Error creating path for uploaded images - err: ${err}`);
      } else {
        form.parse(req);
      }
    });
  });

    // Check permission.
  function checkPermission (req, res, next) {
    // Should be admin.
    if (req.isAuthenticated() && req.user.group.includes('admin')) {
      return next();
    }
    log.warn(req.method, req.originalUrl, ' - permission denied');
    res.json('status: permission denied');
  }

});

module.exports = router;
