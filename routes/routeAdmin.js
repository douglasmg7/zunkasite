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
    // Uset to render the page.
    let data = req.flash();
    data.user = req.isAuthenticated() ? req.user : { name: undefined, group: undefined };
    data.csrfToken = req.csrfToken();
    data.product = product;
    data.productMakers = productMakers;
    data.productCategories = productCategories;
    res.render('admin/product', data);

    // res.render('admin/product', {
    //   user: req.isAuthenticated() ? req.user : { name: undefined, group: undefined },
    //   csrfToken: req.csrfToken(),
    //   product: product,
    //   productMakers: productMakers,
    //   productCategories: productCategories
    // });    
  }).catch(err=>{
    console.log(`Error getting data, err: ${err}`);
  });

  
  // Save product.
  router.post('/product/:product_id', checkPermission, (req, res, next)=>{
    // console.log(`content-type: ${req.get('Content-Type')}`);
    // console.log(`req.body: ${JSON.stringify(req.body)}`);
    console.log(`req.body: ${req.body.id}`);
    // Validation.
    req.checkBody('id', 'Campo CÓDIGO deve ser preenchido.').notEmpty();
    req.checkBody('title', 'Campo TÍTULO deve ser preenchido.').notEmpty();
    req.checkBody('dealer', 'Campo FORNECEDOR deve ser preenchido.').notEmpty();
    req.checkBody('detail', 'Campo DETALHES deve ser preenchido.').notEmpty();
    req.checkBody('description', 'Campo DESCRIÇÃO deve ser preenchido.').notEmpty();
    req.checkBody('tecInfo', 'Campo INFORMAÇÕES TÉCNICAS deve ser preenchido.').notEmpty();
    req.checkBody('extraInfo', 'Campo INFORMAÇÕES ADICIONAIS deve ser preenchido.').notEmpty();
    req.checkBody('dealerWarrantyDays', 'Campo GARANTIA - FORNECEDOR deve ser preenchido.').notEmpty();
    req.checkBody('storeWarrantyDays', 'Campo GARANTIA - LOJA deve ser preenchido.').notEmpty();
    req.checkBody('storeWarratyDetail', 'Campo GARANTIA - OBSERVAÇÃO deve ser preenchido.').notEmpty();
    req.checkBody('markup', 'Campo LUCRO deve ser preenchido.').notEmpty();
    req.checkBody('discount', 'Campo DESCONTO deve ser preenchido.').notEmpty();
    req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      res.json({success: false, messages})
      console.log('redirected.');
      return;
    } 
    else{
      // res.redirect('back');
      // res.redirect('../products');
      res.json({success: true, msg: 'Product saved.'});
      return;      
    }
    // // Save address.
    // else {
    //   if (!req.body.addressId) { return next(new Error('No addressId to find address data.')); }
    //   Address.findById(req.body.addressId, (err, address)=>{
    //     if (err) { return next(err) };
    //     if (!address) { return next(new Error('Not found address to save.')); }
    //     address.user_id = req.user._id;
    //     address.name = req.body.name;
    //     address.cep = req.body.cep;
    //     address.address = req.body.address;
    //     address.addressNumber = req.body.addressNumber;
    //     address.addressComplement = req.body.addressComplement;
    //     address.district = req.body.district;
    //     address.city = req.body.city;
    //     address.state = req.body.state;
    //     address.phone = req.body.phone;
    //     address.save(function(err) {
    //       if (err) { return next(err); } 
    //       res.redirect('/users/address');
    //     });  
    //   });
    // }
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
