'use strict';
const express = require('express');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = mongo.config;
const ObjectId = require('mongodb').ObjectId;
const path = require('path');
const fse = require('fs-extra');
const log = require('../bin/log');
// File upload.
const formidable = require('formidable');
// Page size for admin pagination.
const PAGE_SIZE_ADMIN = 50;
// Page size for site pagination.
const PAGE_SIZE_STORE = 10;
// Get products.
router.get('/', function (req, res) {
  const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
  const skip = (page - 1) * PAGE_SIZE_ADMIN;
  const search = req.query.search
    ? {'dealerProductCommercialize': true, 'desc': {$regex: req.query.search, $options: 'i'}}
    : {'dealerProductCommercialize': true};
    // : {'dealerProductCommercialize': {$exists: true, $eq: true}};
  const cursor = mongo.db.collection(dbConfig.collStoreProducts).find(search).sort({'storeProductTitle': 1}).skip(skip).limit(PAGE_SIZE_ADMIN);
  Promise.all([
    cursor.toArray(),
    cursor.count()
  ]).then(([products, count])=>{
    res.json({products, page, pageCount: Math.ceil(count / PAGE_SIZE_ADMIN)});
  }).catch(err=>{
    console.log(`Error getting data, err: ${err}`);
  });
});
// Get dropdown elements
router.get('/dropdown', function(req, res) {
  Promise.all([
    mongo.db.collection(dbConfig.collProductMakers).find().sort({name: 1}).toArray(),
    mongo.db.collection(dbConfig.collProductCategories).find().sort({name: 1}).toArray()
  ]).then(([productMakers, productCategories])=>{
    res.json({productMakers, productCategories});
  })
  .catch(err=>{
    console.log(`Error dropdwon: ${err}`);
  });
});
// Insert a product.
router.post('/', function(req, res) {
  mongo.db.collection(dbConfig.collStoreProducts).insert(req.body)
  .then(result=>{
    console.log(JSON.stringify(result.ops[0]));
    // Send product inserted (client need the _id).
    res.json(result.ops[0]);
  }).catch(err=>{
    console.log(`Insert product - err: ${err}`);
    res.json('status: fail');
  });
});
// Update a product.
router.put('/:id', function(req, res) {
  // Error if try to update document id.
  delete req.body._id;
  mongo.db.collection(dbConfig.collStoreProducts).updateOne(
    {_id: new ObjectId(req.params.id)},
    {$set: req.body}
  )
  .then(result=>{
    res.json('status: success');
  }).catch(err=>{
    console.log(`saving store products detail - err: ${err}`);
    res.json('status: fail');
  });
});
// Update a product.
router.delete('/:id', function(req, res) {
  // Error if try to update document id.
  delete req.body._id;
  mongo.db.collection(dbConfig.collStoreProducts).deleteOne(
    {_id: new ObjectId(req.params.id)}
  )
  .then(result=>{
    res.json('status: success');
  }).catch(err=>{
    console.log(`saving store products detail - err: ${err}`);
    res.json('status: fail');
  });
});
// Upload product pictures.
router.put('/upload-product-images/:dealer/:_id', (req, res)=>{
  const form = formidable.IncomingForm();
  const DIR_IMG_PRODUCT = path.join(__dirname, '..', 'dist/img/' + req.params.dealer.replace(/\s/g, '') + '/products', req.params._id);
  const MAX_FILE_SIZE_UPLOAD = 10 * 1024 * 1024;
  form.uploadDir = DIR_IMG_PRODUCT;
  form.keepExtensions = true;
  form.multiples = true;
  // Verifiy file size.
  form.on('fileBegin', function(name, file){
    if (form.bytesExpected > MAX_FILE_SIZE_UPLOAD) {
      this.emit('error', `"${file.name}" too big (${(form.bytesExpected / (1024 * 1024)).toFixed(1)}mb)`);
    }
  });
  // Received name and file.
  form.on('file', function(name, file) {
    log.info(`"${file.name}" uploaded to "${file.path}"`);
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
    res.json('status: success');
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
// Get list of product images url.
router.get('/get-product-images-url/:dealer/:_id', function(req, res) {
  const DIR_IMG_PRODUCT = path.join(__dirname, '..', 'dist/img/' + req.params.dealer.replace(/\s/g, '') + '/products', req.params._id);
  // Get list of files.
  fse.readdir(DIR_IMG_PRODUCT, (err, files)=>{
    if (err) {
      // Err, because dir is created when the first image is uploaded.
      log.error(new Error().stack, err.stack);
      res.json([]);
    } else {
      log.info(JSON.stringify(files));
      res.json(files);
    }
  });
});
// Get products to commercialize.
router.get('/products-commercialize', function (req, res) {
  const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
  const skip = (page - 1) * PAGE_SIZE_STORE;
  const search = req.query.search
    ? {'storeProductCommercialize': true, 'storeProductTitle': {$regex: req.query.search, $options: 'i'}}
    : {'storeProductCommercialize': true};
  const cursor = mongo.db.collection(dbConfig.collStoreProducts).find(search).sort({'storeProductTitle': 1}).skip(skip).limit(PAGE_SIZE_STORE);
  Promise.all([
    cursor.toArray(),
    cursor.count()
  ]).then(([products, count])=>{
    res.json({products, page, pageCount: Math.ceil(count / PAGE_SIZE_STORE)});
  }).catch(err=>{
    console.log(`Error getting data, err: ${err}`);
  });
});

module.exports = router;