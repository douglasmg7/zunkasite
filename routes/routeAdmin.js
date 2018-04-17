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
router.get('/productList', function(req, res, next) {
  req.query.search = req.query.search || '';
  // Get products.
  Product.find({}, (err, products)=>{
    // Internal error.
    if (err) { return next(err); }
    // Render.
    else { 
      res.render('admin/productList', {
        showSearchProductInput: true,
        showNewProductButton: true,
        initSearch: req.query.search,
        products: products
      });
    }
  }) 
});

// Get a specific product.
router.get('/product/:product_id', checkPermission, function(req, res, next) {
  // Promise.
  let queryProduct = Product.findById(req.params.product_id);
  let queryProductMaker = ProductMaker.find();
  let queryProductCategorie = ProductCategorie.find();
  Promise.all([queryProduct, queryProductMaker, queryProductCategorie])
  .then(([product, productMakers, productCategories])=>{    
    res.render('admin/product', {
      showSearchProductInput: true,
      product: product,
      productMakers: productMakers,
      productCategories: productCategories
    });    
  }).catch(err=>{
    return next(err);
  });
});

// Save product.
router.post('/product/:productId', checkPermission, (req, res, next)=>{
  // console.log('req.body.product: ' + JSON.stringify(req.body.product));
  // Form validation.
  let validation = {};
  // Discount.
  if (!(req.body.product.storeProductDiscountValue > 0)) { 
    validation.discount = 'Entre com um valor válido.'; 
  }  
  // Markup.
  if (!(req.body.product.storeProductMarkup > 0)) { 
    validation.markup = 'Entre com um valor válido markup.'; 
  }  
  // Send validation erros.
  if (Object.keys(validation).length) {
    res.json({validation});
    return;
  }
  // Save product.
  Product.findOneAndUpdate({_id: req.body.product._id}, req.body.product, function(err, product){
    if (err) { 
      res.json({err});
      return next(err); 
    } else {
      log.info(`Produto ${product._id} updated.`);
      res.json({});
      // Sync upladed images with product.images.
      // Get list of uploaded images.
      fse.readdir(path.join(__dirname, '..', 'dist/img/', req.body.product._id), (err, files)=>{
        if (err) {
          log.error(err + '\n', new Error().stack);
        } 
        else {
          // Remove uploaded images not in product images.
          let exist;
          files.forEach(function(file) {
            exist = false;
            req.body.product.images.forEach(function(image) {
              if (file === image) {
                exist = true;
              }  
            });
            // Uploaded image not in product images.
            if (!exist) {
              // Remove uploaded image.
              let fileToRemove = file;
              fse.remove(path.join(__dirname, '..', 'dist/img/', req.body.product._id, fileToRemove), err=>{
                if (err) { log.error(ERROR().stack, err); }
              });
            }
          });
        }
      }); 
    }
  });
});

// Upload product pictures.
router.put('/upload-product-images/:_id', checkPermission, (req, res)=>{
  const form = formidable.IncomingForm();
  const DIR_IMG_PRODUCT = path.join(__dirname, '..', 'dist/img/', req.params._id);
  const MAX_FILE_SIZE_UPLOAD = 10 * 1024 * 1024;
  form.uploadDir = DIR_IMG_PRODUCT;
  form.keepExtensions = true;
  form.multiples = true;
  form.images = [];
  // Verifiy file size.
  form.on('fileBegin', function(name, file){
    if (form.bytesExpected > MAX_FILE_SIZE_UPLOAD) {
      this.emit('error', `"${file.name}" too big (${(form.bytesExpected / (1024 * 1024)).toFixed(1)}mb)`);
    }
  });
  // Received name and file.
  form.on('file', function(name, file) {
    log.info(`"${file.name}" uploaded to "${file.path}"`);
    form.images.push(path.basename(file.path));
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
    res.json({images: form.images});
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
};

module.exports = router;
