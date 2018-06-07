'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const path = require('path');
const fse = require('fs-extra');
// File upload.
const formidable = require('formidable');
// Models.
const Product = require('../model/product');
const ProductMaker = require('../model/productMaker');
const ProductCategorie = require('../model/productCategorie');
const Order = require('../model/order');
// Max product quantity by Page.
const PRODUCT_QTD_BY_PAGE = 5;
// Max order quantity by Page.
const ORDER_QTD_BY_PAGE = 5;

// Check permission.
function checkPermission (req, res, next) {
  // Should be admin.
  if (req.isAuthenticated() && req.user.group.includes('admin')) {
    return next();
  }
  // log.warn(req.method, req.originalUrl, ' - permission denied');
  // res.json('status: permission denied');
  res.redirect('/users/login');
};

module.exports = router;

/****************************************************************************** 
/  PRODUCTS
******************************************************************************/

// Get product list.
router.get('/', checkPermission, function(req, res, next) {
  res.render('admin/productList', {
    page: req.query.page ? req.query.page : 1,
    search: req.query.search ? req.query.search : '',  
    nav: {
      showAdminLinks: true,
      showNewProductButton: true
    }
  });   
});

// Get products.
router.get('/products', checkPermission, function(req, res, next) {
  const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
  const skip = (page - 1) * PRODUCT_QTD_BY_PAGE;
  const search = req.query.search
    ? { $or: [
        {'storeProductTitle': {$regex: req.query.search, $options: 'i'}}, 
        {'storeProductId': {$regex: req.query.search, $options: 'i'}}
        ]}
    : {};
  // Promisse.
  // Find products.
  let productPromise = Product.find(search).sort({'storeProductTitle': 1}).skip(skip).limit(PRODUCT_QTD_BY_PAGE).exec();
  // Product count.
  let productCountPromise = Product.count(search).exec();
  Promise.all([productPromise, productCountPromise])
  .then(([products, count])=>{    
    res.json({products, page, pageCount: Math.ceil(count / PRODUCT_QTD_BY_PAGE)});
  }).catch(err=>{
    return next(err);
  });
});

// Get a specific product or create a new one.
router.get('/product/:product_id', checkPermission, function(req, res, next) {
  // Product promisse.
  let productPromise = {};
  // New product.
  if (req.params.product_id === 'new') {
    productPromise = new Promise(function(resolve, reject){
      // Create a new product.
      let product = new Product({
        storeProductId: '',
        storeProductTitle: '',
        storeProductCommercialize: false,
        storeProductDetail: '',
        storeProductDescription: '',
        storeProductTechnicalInformation: '',
        storeProductAdditionalInformation: '',
        storeProductMaker: '',
        storeProductCategory: '',
        storeProductPrice: 0,
        storeProductMarkup: 0,
        storeProductDiscountEnable: false,
        storeProductDiscountType: '%',
        storeProductDiscountValue: 0,
        dealerProductQtd: 0,
        dealerProductPrice: 0,
        removeUploadedImage: false,
      });
      resolve(product);
    });      
  }
  // Existing product. 
  else{
    productPromise = Product.findById(req.params.product_id);
  }
  let productMakerPromise = ProductMaker.find().exec();
  let productCategoriePromise = ProductCategorie.find().exec();
  Promise.all([productPromise, productMakerPromise, productCategoriePromise])
  .then(([product, productMakers, productCategories])=>{    
    res.render('admin/product', {
      nav: {
        showAdminLinks: true
      },
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
  // Form validation, true for valid value.
  let validation = {};
  // Price.
  validation.dealerProductPrice = req.body.product.dealerProductPrice >= 0 ? undefined : 'Valor inválido';
  // Markup.
  validation.storeProductMarkup = req.body.product.storeProductMarkup >= 0 ? undefined : 'Valor inválido'; 
  // Discount.
  validation.storeProductDiscountValue = req.body.product.storeProductDiscountValue >= 0 ? undefined: 'Valor inválido';
  // Quantity.
  validation.dealerProductQtd = req.body.product.dealerProductQtd >= 0 ? undefined: 'Valor inválido';
  // Length.
  validation.storeProductLength = req.body.product.storeProductLength >= 0 ? undefined: 'Valor inválido';
  // Height.
  validation.storeProductHeight = req.body.product.storeProductHeight >= 0 ? undefined: 'Valor inválido';
  // Width.
  validation.storeProductWidth = req.body.product.storeProductWidth >= 0 ? undefined: 'Valor inválido';
  // Weight.
  validation.storeProductWeight = req.body.product.storeProductWeight >= 0 ? undefined: 'Valor inválido';
  // Send validation erros if some.
  for (let key in validation){
    if (validation[key]) {
      res.json({validation});
      return;
    }
  }
  // New product.
  if (req.params.productId === 'new') {
    let product = new Product(req.body.product);
    product.save((err, newProduct) => {
      if (err) {
        res.json({err});
        return next(err); 
      } else {
        log.info(`Produto ${newProduct._id} saved.`);
        res.json({});
      }
    });
  }
  // Existing product.
  else {
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
  }
});

// Delete a product.
router.delete('/product/:_id', checkPermission, function(req, res) {
  Product.findByIdAndRemove(req.params._id)
    .then(result=>{
      // Delete images dir.
      fse.remove(path.join(__dirname, '..', 'dist/img/', req.params._id), err=>{
        if (err) { log.error(ERROR().stack, err); }
        res.json({});
        log.info(`Product ${req.params._id} deleted.`);
      });
    })
    .catch(err=>{
      log.error(new Error().stack, err);
      res.json(err);
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



/****************************************************************************** 
/   ORDERS
******************************************************************************/

// Get orders page.
router.get('/orders', checkPermission, function(req, res, next) {
  res.render('admin/orderList', { 
    nav: {
    }
  });   
});

// Get orders data.
router.get('/api/orders', checkPermission, function(req, res, next) {
  const user_id = req.params.user_id;
  const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
  const skip = (page - 1) * ORDER_QTD_BY_PAGE;
  // Db search.
  let search;
  // No search request.
  if (req.query.search == '') {
    search = { 'timestamps.placedAt': { $exists: true } };
  } 
  // Search by _id.
  else if (req.query.search.match(/^[a-f\d]{24}$/i)) {
    search = { 'timestamps.placedAt': {$exists: true}, _id: req.query.search };
  }
  // No search by _id.
  else {
    search = { 
      'timestamps.placedAt': {$exists: true},
      $or: [ 
        {'name': {$regex: req.query.search, $options: 'i'}},
        {totalPrice: {$regex: req.query.search, $options: 'i'}},
        {'items.name': {$regex: req.query.search, $options: 'i'}},
      ] 
    }
  }
  // console.log(`search: ${JSON.stringify(search)}`);
  // Find orders.
  let orderPromise = Order.find(search).sort({'timestamps.placedAt': -1}).skip(skip).limit(ORDER_QTD_BY_PAGE).exec();
  // Order count.
  let orderCountPromise = Order.find(search).count().exec();
  Promise.all([orderPromise, orderCountPromise])
  .then(([orders, count])=>{    
    res.json({orders, page, pageCount: Math.ceil(count / ORDER_QTD_BY_PAGE)});
  }).catch(err=>{
    return next(err);
  });
});

// Get orders data.
router.get('/api/orders_', checkPermission, function(req, res, next) {
  const user_id = req.params.user_id;
  const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
  const skip = (page - 1) * ORDER_QTD_BY_PAGE;
  console.log(`filter: ${JSON.stringify(req.query.filter)}`);
  console.log(`filter: ${req.query.filter}`);

  // Db search.
  let search;
  // No search request.
  if (req.query.search == '') {
    search = { 'timestamps.placedAt': {$exists: true} };
  } 
  // Search by _id.
  else if (req.query.search.match(/^[a-f\d]{24}$/i)) {
    search = { 'timestamps.placedAt': {$exists: true}, _id: req.query.search };
  }
  // No search by _id.
  else {
    search = { 
      'timestamps.placedAt': {$exists: true},
      $or: [ 
        {'name': {$regex: req.query.search, $options: 'i'}},
        {totalPrice: {$regex: req.query.search, $options: 'i'}},
        {'items.name': {$regex: req.query.search, $options: 'i'}},
      ] 
    }
  }
  // console.log(`search: ${JSON.stringify(search)}`);
  // Find orders.
  let orderPromise = Order.find(search).sort({'timestamps.placedAt': -1}).skip(skip).limit(ORDER_QTD_BY_PAGE).exec();
  // Order count.
  let orderCountPromise = Order.find(search).count().exec();
  Promise.all([orderPromise, orderCountPromise])
  .then(([orders, count])=>{    
    res.json({orders, page, pageCount: Math.ceil(count / ORDER_QTD_BY_PAGE)});
  }).catch(err=>{
    return next(err);
  });
});

// Change order status.
router.post('/api/order/status/:_id/:status', checkPermission, function(req, res, next) {
  // To update order on db.
  let update = {};
  // Status to change.
  switch (req.params.status){
    case 'paid':
      update.status = 'paid';
      update.timestamps.paidAt = new Date();
      break;
    case 'shipped':
      update.status = 'shipped';
      update.timestamps.shippedAt = new Date();
      break;
    case 'delivered':
      update.status = 'delivered';
      update.timestamps.deliveredAt = new Date();
      break;
    case 'canceled':
      update.status = 'canceled';
      update.timestamps.canceleddAt = new Date();
      break;
    default:
      res.json({ err: 'No valid status.'})
      return;
  }
  // console.log(`update: ${JSON.stringify(update)}`);
  // Update order.
  Order.findByIdAndUpdate(req.params._id, update, { new: true }, (err, order)=>{
    if (err) { 
      res.json({err: err});
      return next(err); 
    } else {
      res.json({order});
    }
  });
});