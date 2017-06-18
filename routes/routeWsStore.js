'use strict';
const express = require('express');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = mongo.config;
const ObjectId = require('mongodb').ObjectId;
const path = require('path');
const fs = require('fs');
// file upload
const formidable = require('formidable');
// page size for admin pagination
const PAGE_SIZE_ADMIN = 50;
// page size for site pagination
const PAGE_SIZE_STORE = 10;
// get products
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
// update a store product
router.put('/:id', function(req, res) {
  // error if try to update document id
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
// upload product pictures
router.put('/upload-product-images/:id', (req, res)=>{
  const form = formidable.IncomingForm();
  const DIR_IMG_PRODUCT = path.join(__dirname, '..', 'dist/img/allnations/products', req.params.id);
  const MAX_FILE_SIZE_UPLOAD = 10 * 1024 * 1024;
  form.uploadDir = DIR_IMG_PRODUCT;
  form.keepExtensions = true;
  form.multiples = true;
  // verifiy file size
  form.on('fileBegin', function(name, file){
    if (form.bytesExpected > MAX_FILE_SIZE_UPLOAD) {
      this.emit('error', `"${file.name}" too big (${(form.bytesExpected / (1024 * 1024)).toFixed(1)}mb)`);
    }
  });
  // name / file pair has been received
  form.on('file', function(name, file) {
    // fs.rename(file.path, path.join(form.uploadDir, file.name));
    console.log(`"${file.name}" uploaded to "${file.path}"`);
  });
  // err
  form.on('error', function(err) {
    console.log(`error uploading file: ${err}`);
    res.writeHead(413, {'connection': 'close', 'content-type': 'text/plain'});
    res.end(err);
    req.connection.destroy();
  });
  // all files have been uploaded
  form.on('end', function() {
    res.json('status: success');
  });
  // create folder and start upload
  fs.mkdir(DIR_IMG_PRODUCT, err=>{
    // other erro than file alredy exist
    if (err && err.code !== 'EEXIST') {
      console.log(`error creating path upload images - err: ${err}`);
    } else {
      form.parse(req);
    }
  });
});
// get list of product images url
router.get('/get-product-images-url/:id', function(req, res) {
  const DIR_IMG_PRODUCT = path.join(__dirname, '..', 'dist/img/allnations/products', req.params.id);
  // get list of files
  fs.readdir(DIR_IMG_PRODUCT, (err, files)=>{
    if (err) {
      console.log(`error load list of files: ${err}`);
      res.json([]);
    } else {
      console.log(JSON.stringify(files));
      res.json(files);
      // res.json({a: 'asdf'});
    }
  });
});
// get products to commercialize
router.get('/products-commercialize', function (req, res) {
  const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
  const skip = (page - 1) * PAGE_SIZE_STORE;
  const search = req.query.search
    ? {'storeProductCommercialize': true, 'storeProductTitle': {$regex: req.query.search, $options: 'i'}}
    : {'storeProductCommercialize': true};
    // : {'dealerProductCommercialize': {$exists: true, $eq: true}};
  // console.log(`page: ${page}, search: ${JSON.stringify(search)}, skip: ${skip}`);
  const cursor = mongo.db.collection(dbConfig.collStoreProducts).find(search).sort({'storeProductTitle': 1}).skip(skip).limit(PAGE_SIZE_STORE);
  Promise.all([
    cursor.toArray(),
    cursor.count()
  ]).then(([products, count])=>{
    res.json({products, page, pageCount: Math.ceil(count / PAGE_SIZE_STORE)});
    // console.log(`products: ${JSON.stringify(products)}, page: ${page}`);
  }).catch(err=>{
    console.log(`Error getting data, err: ${err}`);
  });
});
module.exports = router;
