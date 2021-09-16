'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const util = require('util');
const path = require('path');
const fse = require('fs-extra');
const axios = require('axios');
const { check, validationResult } = require('express-validator/check');
const { exec } = require('child_process');
const moment = require('moment');
moment.locale('pt-br');
const cnpj = require("@fnando/cnpj/commonjs");
// File upload.
const formidable = require('formidable');
// To resize images.
const imageUtil = require('../util/image');
// Models.
const ObjectId = require('mongoose').Types.ObjectId;
const Product = require('../model/product');
const Order = require('../model/order');
const Invoice = require('../model/invoice');
const User = require('../model/user');
const ShippingPrice = require('../model/shippingPrice');
const Markdown = require('../model/markdown');
const markdownCache = require('../model/markdownCache');
// Lists.
const productCategories = require('../util/productCategories');
const productMakers = require('../util/productMakers.js');
// Redis.
const redis = require('../db/redis');
const redisUtil = require('../util/redisUtil');
// Dealers.
const dealerUtil = require('../util/dealerUtil');
// Internal.
const s = require('../config/s');
const zoom = require('../util/zoom');
const allnations = require('../util/allnations');
// Product util.
const productUtil = require('../util/productUtil');
// Max product quantity by Page.
const PRODUCT_QTD_BY_PAGE = 20;
// Max order quantity by Page.
const ORDER_QTD_BY_PAGE = 20;
// Meli categories.
const MeliCategory = require('../model/meliCategory');

// Check permission.
function checkPermission (req, res, next) {
	// Should be admin.
	if (req.isAuthenticated() && req.user.group.includes('admin')) {
		return next();
	}
	// log.warn(req.method, req.originalUrl, ' - permission denied');
	// res.json('status: permission denied');
	res.redirect('/user/signin');
};

// Format date.
function formatDate(val){
    return moment(val, 'DD/MM/YYYY hh:mm:ss').format('DD-MMM-YYYY kk:mm');
}

// Format money.
function formatMoney(val){
    if (!val) {
        return ""
    }
    return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


/******************************************************************************
/  PRODUCTS
 ******************************************************************************/

// // Get product list.
// router.get('/', checkPermission, function(req, res, next) {
	// res.render('admin/productList', {
		// page: req.query.page ? req.query.page : 1,
		// search: req.query.search ? req.query.search : '',
		// nav: {
			// showAdminLinks: true,
			// showNewProductButton: true
		// }
	// });
// });

// Get product list.
router.get('/', checkPermission, async function(req, res, next) {
    try {
        let filter = await redisUtil.getPorductListFilter(req.user._id);
        // log.debug(`router-filter: ${JSON.stringify(filter, null, 2)}`);
        if (!filter) {
            filter = {
                dealer: 'Todos',
                category: 'Todas',
                maker: 'Todos',
                showCommercialize: true,
                showNotCommercialize: false,
                showInStock: true,
                showOutOfStock: false
            }
        }
        res.render('admin/productList', {
            page: req.query.page ? req.query.page : 1,
            search: req.query.search ? req.query.search : '',
            nav: {
                showAdminLinks: true,
                showNewProductButton: true
            },
            makers: productMakers.makers,
            categories: productCategories.categories,
            filter,
        });
    }
    catch(err) {
        log.error(`Getting admin product list. ${err}`);
    }
});

// Get products.
router.get('/products', checkPermission, function(req, res, next) {
	const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
	const skip = (page - 1) * PRODUCT_QTD_BY_PAGE;
    let filter = {
            dealer: req.query.dealer,
            category: req.query.category,
            maker: req.query.maker,
            showCommercialize: req.query.showCommercialize == 'true'? true : false,
            showNotCommercialize: req.query.showNotCommercialize == 'true'? true : false,
            showInStock: req.query.showInStock == 'true'? true : false,
            showOutOfStock: req.query.showOutOfStock == 'true'? true : false,
    }
    // log.debug(`filter in: ${JSON.stringify(filter, null, 2)}`);
	let search = req.query.search
		? { $or: [
                {'storeProductTitle': {$regex: req.query.search, $options: 'i'}},
                {'storeProductId': {$regex: req.query.search, $options: 'i'}}
		    ],
            'deletedAt': {$exists: false}
        }
		: {'deletedAt': {$exists: false}};
    // filters
    // dealer
    if (filter.dealer != 'Todos') {
        search.dealerName = req.query.dealer
    }
    // cateogry
    if (filter.category != 'Todas') {
        search.storeProductCategory = req.query.category
    }
    if (filter.maker != 'Todos') {
        search.storeProductMaker = req.query.maker
    }
    // commercialize
    // no sense none selected
    if (!filter.showCommercialize && !filter.showNotCommercialize) {
        filter.showCommercialize = true;
        filter.showNotCommercialize = true;
    }
    if (!filter.showNotCommercialize) {
        search.storeProductCommercialize = true;
    }
    if (!filter.showCommercialize) {
        search.storeProductCommercialize = false;
    }
    // stock
    // no sense none selected
    if (!filter.showInStock && !filter.showOutOfStock) {
        filter.showInStock = true;
        filter.showOutOfStock = true;
    }
    if (!filter.showOutOfStock) {
        search.storeProductQtd = {$gt: 0};
    }
    if (!filter.showInStock) {
        search.storeProductQtd = {$eq: 0};
    }
    redisUtil.setPorductListFilter(req.user._id, filter)
    // log.debug(`search: ${JSON.stringify(search, null, 2)}`);
	// Promisse.
	// Find products.
	let productPromise = Product.find(search).sort({'storeProductTitle': 1}).skip(skip).limit(PRODUCT_QTD_BY_PAGE).exec();
	// Product count.
	let productCountPromise = Product.countDocuments(search).exec();
	Promise.all([productPromise, productCountPromise])
		.then(([products, count])=>{
            // log.debug(`filter: ${JSON.stringify(filter, null, 2)}`);
			res.json({products, page, pageCount: Math.ceil(count / PRODUCT_QTD_BY_PAGE), filter});
		}).catch(err=>{
			return next(err);
		});
});

// // Get products.
// router.get('/products', checkPermission, function(req, res, next) {
	// const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
	// const skip = (page - 1) * PRODUCT_QTD_BY_PAGE;
	// const search = req.query.search
		// ? { $or: [
                // {'storeProductTitle': {$regex: req.query.search, $options: 'i'}},
                // {'storeProductId': {$regex: req.query.search, $options: 'i'}}
			// ],
            // 'deletedAt': {$exists: false}
        // }
		// : {'deletedAt': {$exists: false}};
	// // Promisse.
	// // Find products.
	// let productPromise = Product.find(search).sort({'storeProductTitle': 1}).skip(skip).limit(PRODUCT_QTD_BY_PAGE).exec();
	// // Product count.
	// let productCountPromise = Product.countDocuments(search).exec();
	// Promise.all([productPromise, productCountPromise])
		// .then(([products, count])=>{
			// res.json({products, page, pageCount: Math.ceil(count / PRODUCT_QTD_BY_PAGE)});
		// }).catch(err=>{
			// return next(err);
		// });
// });

// Get a specific product or create a new one.
router.get('/product/:product_id', checkPermission, function(req, res, next) {
	// Product promisse.
	let productPromise = {};
	// New product.
	if (req.params.product_id === 'new') {
		productPromise = new Promise(function(resolve, reject){
			// Create a new product.
			let product = new Product({
				dealerName: 'Dell',
                dealerProductActive: true,
                dealerProductPrice: 0,
				storeProductId: '',
				storeProductTitle: '',
				storeProductActive: false,
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
				storeProductQtd: 0,
				storeProductPrice: 0,
				removeUploadedImage: false,
			});
			resolve(product);
		});
	}
	// Existing product.
	else{
		productPromise = Product.findById(req.params.product_id);
	}
	Promise.all([productPromise])
	.then(([product])=>{
        if (!product) {
            res.status(404).send('Produto não existe.');
        }
        else if (product.deletedAt) {
            res.status(404).send('Produto removido.');
        } else {
            // log.debug(`warranties: ${JSON.stringify(markdownCache.warranties())}`);
            // log.debug(`product.updateAt: ${product.updatedAt}`);
            // log.debug(`product.editedAt: ${product.editedAt}`);
            res.render('admin/product', {
                nav: {
                    showAdminLinks: true
                },
                product: product,
                productMakers: productMakers.makers,
                productCategories: productCategories.categories,
                warranties: markdownCache.warranties(),
            });
        }
	}).catch(err=>{
		return next(err);
	});
});

// Save product.
router.post('/product/:productId', checkPermission, (req, res, next)=>{
	// Form validation, true for valid value.
	let validation = {};
	// Dealer price.
	validation.dealerProductPrice = parseFloat(req.body.product.dealerProductPrice) >= 0 ? undefined : 'Valor inválido';
	// Price.
	validation.storeProductPrice = parseFloat(req.body.product.storeProductPrice) >= 0 ? undefined : 'Valor inválido';
	// Markup.
	validation.storeProductMarkup = parseFloat(req.body.product.storeProductMarkup) >= 0 ? undefined : 'Valor inválido';
	// Discount.
	validation.storeProductDiscountValue = parseFloat(req.body.product.storeProductDiscountValue) >= 0 ? undefined: 'Valor inválido';
	// Quantity.
	validation.storeProductQtd = parseFloat(req.body.product.storeProductQtd) >= 0 ? undefined: 'Valor inválido';
	// Length.
	if (req.body.product.storeProductLength.toString().includes(",") || req.body.product.storeProductLength.toString().includes(".")) {
		validation.storeProductLength = 'Valor deve ser sem precisão decimal';
	}
	else {
		validation.storeProductLength = req.body.product.storeProductLength > 0 ? undefined: 'Valor inválido';
	}
	// Height.
	if (req.body.product.storeProductHeight.toString().includes(",") || req.body.product.storeProductHeight.toString().includes(".")) {
		validation.storeProductHeight = 'Valor deve ser sem precisão decimal';
	}
	else {
		validation.storeProductHeight = req.body.product.storeProductHeight > 0 ? undefined: 'Valor inválido';
	}
	// Width.
	if (req.body.product.storeProductWidth.toString().includes(",") || req.body.product.storeProductWidth.toString().includes(".")) {
		validation.storeProductWidth = 'Valor deve ser sem precisão decimal';
	}
	else {
		validation.storeProductWidth = req.body.product.storeProductWidth > 0 ? undefined: 'Valor inválido';
	}
	// Weight.
	if (req.body.product.storeProductWeight.toString().includes(",") || req.body.product.storeProductWeight.toString().includes(".")) {
		validation.storeProductWeight = 'Valor deve ser sem precisão decimal';
	}
	else {
		validation.storeProductWeight = req.body.product.storeProductWeight > 0 ? undefined: 'Valor inválido';
	}
	// EAN (13 digits).
    // ^(?![\s\S]) - Empty match.
    if (req.body.product.ean === undefined) {
        req.body.product.ean = '';
    }
    // Display priority.
	validation.displayPriority = parseInt(req.body.product.displayPriority) >= 0 ? undefined: 'deve ser maior ou igual a zero';

    req.body.product.ean = req.body.product.ean.trim();
	validation.ean = req.body.product.ean.match(/^(\d{13}|)$/) ? undefined: 'Deve conter 13 digitos ou vazio';
	// Send validation erros if some.
	for (let key in validation){
		if (validation[key]) {
            // log.debug(`Validations: ${JSON.stringify(validation, null, 2)}`);
			res.json({validation});
			return;
		}
	}
	// Trim some itens.
	req.body.product.storeProductTechnicalInformation = req.body.product.storeProductTechnicalInformation.trim();
	// New product.
	if (req.params.productId === 'new') {
		let product = new Product(req.body.product);
        // Manual created product, no dealer information.
        product.dealerProductActive = true;
		product.save((err, newProduct) => {
			if (err) {
				res.json({err});
				return next(err);
			} else {
				log.info(`Product ${newProduct._id} created`);
				res.json({ isNew: true, product: newProduct });
                productUtil.updateCommercializeStatus();
			}
		});
	}
	// Existing product.
	else {
		// Save product.
        log.debug(`Saving product ${req.body.product._id}, dealerProductActive: ${req.body.product.dealerProductActive}`);
        log.debug(`Saving product ${req.body.product._id}, storeProductId: ${req.body.product.storeProductId}`);
        // Not update editedAt on save product.
        // req.body.product.editedAt = Date.now();
		Product.findOneAndUpdate({_id: req.body.product._id}, req.body.product, { new: true },  function(err, product){
			if (err) {
				res.json({err});
				return next(err);
			} else {
				res.json({});
				log.info(`Product ${product._id} updated`);
				// log.info(`Product title ${product.storeProductTitle} updated`);
                productUtil.updateProductsWithSameStoreProductId(product);
				// Sync upladed images with product.images.
				// Get list of uploaded images.
				fse.readdir(path.join(__dirname, '..', 'dist/img/', req.body.product._id), (err, files)=>{
					if (err) {
						log.error(err.stack);
					}
					else {
						// Remove uploaded images not in product images.
						let exist;
						files.forEach(function(file) {
							exist = false;
							req.body.product.images.forEach(function(image) {
								// Not remove resized images.
								let pathObj = path.parse(image);
								let img_0080 = pathObj.name + '_0080px' + pathObj.ext;
								let img_0500 = pathObj.name + '_0500px' + pathObj.ext;
								if ((file === image) || (file === img_0080) || (file === img_0500)) {
									exist = true;
								}
							});
							// Uploaded image not in product images.
							if (!exist) {
								// Remove uploaded image.
								let fileToRemove = file;
                                log.debug(`Removing image: ${path.join(__dirname, '..', 'dist/img/', req.body.product._id, fileToRemove)}`);
								fse.remove(path.join(__dirname, '..', 'dist/img/', req.body.product._id, fileToRemove), err=>{
									if (err) { log.error(err.stack); }
								});
							}
						});
					}
				});
			}
		});
	}
});

// Update editedAt.
router.put('/product/:productId/edited-at', checkPermission, async (req, res, next)=>{
    try {
        let product = await Product.findById(req.params.productId).exec();
        let now = Date.now();
        product.editedAt = now;
        let savedProduct = await product.save();
        // log.debug(`savedProduct: ${savedProduct}`);
        return res.json({product: savedProduct});
    } catch(err) {
        log.error(`Updating product editedAt. ${err.stack}`);
        return res.status(500);
    }
});

// Delete a product.
router.delete('/product/:_id', checkPermission, function(req, res) {
    Product.findById(req.params._id)
        .then(product=>{
            product.storeProductCommercialize = false;  // To not show into the site.
            product.deletedAt = Date.now();
            return product.save();
        }).then(product=>{
            res.json({});
            log.info(`Deleted product ${product._id}.`);
            productUtil.updateCommercializeStatus();
            // Delete mongodb id from zunkasrv.
            // Aldo
            if (product.dealerName = "Aldo") {
                // Delete reference product on integration server.
                // log.debug(`axios delete: ${s.zunkaServer.host}/${product.dealerName.toLowerCase()}/product/mongodb_id/${product.dealerProductId}`);
                axios.delete(`${s.zunkaServer.host}/${product.dealerName.toLowerCase()}/product/mongodb_id/${product.dealerProductId}`, {
                    headers: {
                        "Accept": "text/plain", 
                    },
                    auth: {
                        username: s.zunkaServer.user,
                        password: s.zunkaServer.password
                    },
                })
                .then(response => {
                    if (response.data.err) {
                        log.err(`Deleting mongodbId from zunkasrv, id: ${product._id}, code: ${product.dealerProductId}. ${response.data.err}`);
                    } 
                })
                .catch(err => {
                    log.error(`Deleting mongodbId from zunkasrv, id: ${product._id}, code: ${product.dealerProductId}. ${err}`);
                }); 
            }
            // Delete mongodb id from zunkasrv.
            // Aldo
            if (product.dealerName = "Allnations") {
                // Delete reference product on integration server.
                // log.debug(`axios delete: ${s.zunkaServer.host}/${product.dealerName.toLowerCase()}/product/mongodb_id/${product.dealerProductId}`);
                axios.delete(`${s.zunkaServer.host}/${product.dealerName.toLowerCase()}/product/zunka_product_id/${product.dealerProductId}`, {
                    headers: {
                        "Accept": "text/plain", 
                    },
                    auth: {
                        username: s.zunkaServer.user,
                        password: s.zunkaServer.password
                    },
                })
                .then(response => {
                    if (response.data.err) {
                        log.err(`Deleting zunka product id from zunkasrv, id: ${product._id}, code: ${product.dealerProductId}. ${response.data.err}`);
                    } 
                })
                .catch(err => {
                    log.error(`Deleting zunka product id from zunkasrv, id: ${product._id}, code: ${product.dealerProductId}. ${err}`);
                }); 
            }
        }).catch(err=>{
            log.error(`Deleting product, product _id: ${req.params._id}. ${err.stack}`);
            res.json(err);
        });
});

// Get product by zunka code.
router.get('/product-by-store-product-id/:storeProductId', checkPermission, function(req, res, next) {
	// Product promisse.
	let productPromise = {};
    productPromise = Product.findOne({storeProductId: req.params.storeProductId});
	Promise.all([productPromise])
	.then(([product])=>{
        if (!product) {
            res.json();
        }
        else if (product.deletedAt) {
            res.json();
        } else {
            res.json({product});
            // log.debug(`Product: ${JSON.stringify(product, null, 4)}`);
        }
	}).catch(err=>{
		return next(err);
	});
});

// Get products by EAN.
router.get('/products-same-ean', async function(req, res, next) {
    try {
        let products = await productUtil.getSameEanProducts(req.query.ean);
        // log.debug(`router products: ${products}`);
        // log.debug(`router products count: ${products.length}`);
        return res.json({products: products});
    } catch(err) {
        log.error(`[catch] Getting products by EAN: ${err.stack}`);
        return res.status(500).send(err);
    }
});


// Get product by zunka code.
router.post('/product-copy-images/', checkPermission, function(req, res, next) {
    try {
        // log.debug(`srcId: ${req.body.srcId}`);
        // log.debug(`dstId: ${req.body.dstId}`);
        productUtil.copyImageFiles(req.body.srcId, req.body.dstId);
        // log.debug(`req.body: ${JSON.stringify(req.body, null, 4)}`);
        res.send();
    } catch(err) {
        return next(err);
        // res.status(500).send();
    }
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
	let uploadedImgPath = [];
	// Verifiy file size.
	form.on('fileBegin', function(name, file){
		if (form.bytesExpected > MAX_FILE_SIZE_UPLOAD) {
			this.emit('error', `"${file.name}" too big (${(form.bytesExpected / (1024 * 1024)).toFixed(1)}mb)`);
		}
	});
	// Received name and file.
	form.on('file', function(name, file) {
		log.info(`"${file.name}" uploaded to "${file.path}"`);
		uploadedImgPath.push(file.path);
		form.images.push(path.basename(file.path));
	});
	// Err.
	form.on('error', function(err) {
		log.error(err.stack);
		res.writeHead(413, {'connection': 'close', 'content-type': 'text/plain'});
		res.end(err);
		req.connection.destroy();
	});
	// All files have been uploaded.
	form.on('end', function() {
		res.json({images: form.images});
		// log.info(JSON.stringify(uploadedImgPath));
		imageUtil.createResizedImgs(uploadedImgPath);
	});
	// Create folder if not exist and start upload.
	fse.ensureDir(DIR_IMG_PRODUCT, err=>{
		// Other erro than file alredy exist.
		if (err && err.code !== 'EEXIST') {
			log.error(err.stack);
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

// Order info page.
// router.get('/order/:_id', checkPermission, async (req, res, next) => {
router.get('/order/:_id', function(req, res, next) {
    let promises = [
        Order.findById(req.params._id).exec().catch(err=>{log.error(`Finding order by id. ${err}`)})
    ]
    Promise.all(promises)
        .then(async ([order])=>{
            // Order exist.
            if (order) {
                // Bookings
                let bookings = [];
                for(let i=0; i < order.items.length;  i++) {
                    bookings.push({});
                    // log.debug(`--- order.items: ${JSON.stringify(order.items[i], null, 2)}`);
                    if (order.items[i].dealerName == 'Allnations') {
                        let bookingResult = await allnations.getBooking(order.items[i]);
                        if (bookingResult) {
                            // order.items[i].booking = bookingResult;
                            bookings[i] = bookingResult;
                            // log.debug(`bookingResult: ${JSON.stringify(bookingResult, null, 2)}`);
                            // log.debug(`order.items[i].booking: ${JSON.stringify(order.items[i].booking, null, 2)}`);
                        }
                    }
                };
                // log.debug(`order.items: ${JSON.stringify(order.items, null, 2)}`);
                if (order.externalOrderNumber) {
                    // Get zoom order.
                    zoom.getZoomOrder(order.externalOrderNumber, (err, zoomOrder)=>{
                        if (err) {
                            log.error(err.stack);
                            return res.status(500).send();
                        }
                        if (!zoomOrder) {
                            return res.status(500).send('Could not retrive zoom order');
                        }
                        // log.debug(`zoomOrder: ${JSON.stringify(zoomOrder, null, 2)}`);
                        let today = moment().format('YYYY-MM-DDTHH:mm');
                        // Signal to show set status panel.
                        let showSetStatusPanel = req.query.setStatus? true: false
                        // If order status changed to delivered by zoom.
                        if (zoomOrder.status.toLowerCase() == 'delivered') {
                            // UPdate status on the zunkasite.
                            Order.findByIdAndUpdate(order._id, { 
                                $set: { 
                                    status: 'delivered',
                                    'timestamps.deliveredAt': new Date(),
                                }
                            })
                                .then(()=>{
                                    log.debug(`Zoom changed order to deliverd status automatically, order _id: ${order._id}, zoom order number: ${order.externalOrderNumber}`);
                                })
                                .catch(err=>{
                                    log.error(`Saving on db, zoom order to status deliverd, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}. ${err.stack}`);
                                });
                        }
                        return res.render('admin/zoomOrder', { order, bookings, zoomOrder, formatDate, formatMoney, today: today, showSetStatusPanel: showSetStatusPanel });
                    });
                }
                else {
                    // log.debug(`bookings: ${JSON.stringify(bookings, null, 2)}`);
                    return res.render('admin/order', { order, bookings });
                }
            }
            // Order not exist.
            else {
                return res.status(410).send(`Pedido não existe.`);
            }
        }).catch(err=>{
            return next(err);
        });
});

// Set zoom order processed.
router.post('/zoom-order/:_id', checkPermission, function(req, res, next) {
    // log.debug(`req.params._id: ${req.params._id}`);
    // log.debug(`req.body.zoomOrderNumber: ${req.body.zoomOrderNumber}`);
    // log.debug(`req.body.action: ${req.body.action}`);
    // Not valid zoom order number.
    if (!req.body.zoomOrderNumber) {
        return res.json({success: false, errMessage: `Inválido zoom order number: ${req.body.zoomOrderNumber}`});
    } 
    // Update order status at zoom server.
    else {
        // Processed.
        if (req.body.action === 'processed') {
            axios.put(`${s.zoom.host}/order/${req.body.zoomOrderNumber}/processed`, {}, { auth: { username: s.zoom.user, password: s.zoom.password }, })
                .then(response => {
                    console.log(`zoom orders: ${JSON.stringify(response.data, null, 2)}`);
                    if (response.data.err) {
                        log.error(`Set zoom order processed, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}. ${response.data.err}`);
                        return res.json({success: false, errMessage: response.data.err});
                    } else {
                        return res.json({success: true});
                    }
                })
                .catch(err => {
                    log.error(`[catch] [axios] Set zoom order processed, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}\nresponse.hreaders: ${util.inspect(err.response.headers)}\nresponse.data: ${util.inspect(err.response.data)}\n${err.stack}`);
                    return res.json({success: false, errMessage: err.response.data});
                }); 
        }
        // Shipment
        else if (req.body.action === 'shipment') {
            // log.debug(`req.body: ${JSON.stringify(req.body, null, 2)}`)
            // Check fields.
            // Sent date.
            let invalid = {};
            log.debug(`req.body.sentDate: ${req.body.sentDate}`);
            if (!req.body.sentDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                invalid.sentDate = 'Valor inválido'; 
            }
            // Carrier name.
            if (!req.body.carrierName.match(/^.{1,100}$/)) {
                invalid.carrierName = 'Valor inválido'; 
            }
            // Tracking number.
            if (!req.body.trackingNumber.match(/^.{1,20}$/)) {
                invalid.trackingNumber = 'Valor inválido'; 
            }
            // Url.
            if (!req.body.trackingUrl.match(/^.{1,100}$/)) {
                invalid.trackingUrl = 'Valor inválido'; 
            }
            // Invalid fields.
            if (Object.keys(invalid).length) {
                return res.json({ success: false, invalid });
            } 
            // Valid.
            else {
                let data = {
                    sent_date: moment(req.body.sentDate, 'YYYY-MM-DDTHH:mm').format('DD/MM/YYYY HH:mm:00'),
                    carrier_name: req.body.carrierName,
                    tracking_number: req.body.trackingNumber,
                    url: req.body.trackingUrl,
                }

                // Find orders.
                let orderPromise = Order.findById(req.params._id).exec();
                // Order count.
                let invoicePromise = Invoice.findOne({ 'orderId': new ObjectId(req.params._id) }).exec();
                Promise.all([orderPromise, invoicePromise])
                    .then(([order, invoice])=>{
                        // No order.
                        if (!order) {
                            log.error(`Set zoom order shipped, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}. Order not found.`);
                            return res.json({success: false, errMessage: 'Order not found.'});
                        }
                        // No invoice.
                        if (!invoice){
                            log.error(`Set zoom order shipped, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}. Invoice not found.`);
                            return res.json({success: false, errMessage: 'Invoice not found.'});
                        }
                        data.invoice = {
                            number: invoice.number,
                            access_key: invoice.accessKey,
                            cnpj: invoice.cnpj,
                            issue_date: moment(invoice.issueDate, 'YYYY-MM-DDTHH:mm').format('DD/MM/YYYY HH:mm:00'),
                            series: invoice.serie,
                            url: invoice.url
                        };
                        data.sent_items = [];
                        order.items.forEach(item=>{
                            data.sent_items.push({
                                product_id: item._id,
                                quantity: item.quantity
                            })
                        });
                        // Nothing to put here, so order _id.
                        data.shipment_id = order._id;
                        // log.debug(`data: ${JSON.stringify(data, null, 2)}`);
                        // return res.json({success: false, errMessage: 'some test.'});

                        // Set shipped on zoom server.
                        axios.post(`${s.zoom.host}/order/${req.body.zoomOrderNumber}/shipment`, data, { auth: { username: s.zoom.user, password: s.zoom.password }, })
                            .then(response => {
                                // log.debug(`zoom order set shipment response: ${JSON.stringify(response.data, null, 2)}`);
                                if (response.data.err) {
                                    log.error(`Set zoom order shipment, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}, \ndata: ${JSON.stringify(data, null, 2)}. ${response.data.err}`);
                                    return res.json({success: false, errMessage: response.data.err});
                                } else {
                                    res.json({success: true});
                                    // Set order status.
                                    order.timestamps.shippedAt = new Date(); 
                                    order.status = 'shipped';
                                    order.save(err=>{
                                        if (err) {
                                            log.error(`Saving on db, zoom order to status shipped, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}. ${err.stack}`);
                                        }
                                    });
                                    return;
                                }
                            })
                            .catch(err => {
                                log.error(`[catch] [axios] Set zoom order shipment, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}, \nresponse.data: ${util.inspect(err.response.data)}, \ndata: ${JSON.stringify(data, null, 2)}\n\t ${err.stack}`);
                                // log.error(`err.request: ${util.inspect(err.request, true, 2)}`);
                                // log.error(`err.response.data: ${util.inspect(err.response.data)}`);
                                // log.error(`err.response.headers: ${util.inspect(err.response.headers)}`);
                                return res.json({success: false, errMessage: err.response.data});
                            }); 
                    }).catch(error=>{
                        log.error(`[catch] Set zoom order shipment, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}. ${error.stack}`);
                        return res.json({success: false, errMessage: 'Alguma coisa deu errado.'});
                    });
            }        
        }
        // Delivery.
        else if (req.body.action === 'delivered') {
            log.debug(`req.body: ${JSON.stringify(req.body, null, 2)}`)
            // Check fields.
            let invalid = {};
            if (!req.body.deliveryDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                invalid.deliveryDate = 'Valor inválido'; 
            }
            // Invalid fields.
            if (Object.keys(invalid).length) {
                return res.json({ success: false, invalid });
            } 
            // Valid.
            else {
                // Set shipped on zoom server.
                let config = { 
                    auth: { username: s.zoom.user, password: s.zoom.password },
                    params: { delivered_date: req.body.deliveredDate }
                }
                axios.put(`${s.zoom.host}/order/${req.body.zoomOrderNumber}/delivered`, {}, config)
                    .then(response => {
                        // log.debug(`zoom order set deliverd response: ${JSON.stringify(response.data, null, 2)}`);
                        if (response.data.err) {
                            log.error(`Set zoom order delivered, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}\n${response.data.err}`);
                            return res.json({success: false, errMessage: response.data.err});
                        } else {
                            res.json({success: true});
                            Order.findByIdAndUpdate(req.params._id, { 
                                $set: { 
                                    status: 'delivered',
                                    'timestamps.deliveredAt': new Date(),
                                }
                            })
                                .then(()=>{
                                })
                                .catch(err=>{
                                    log.error(`Saving on db, zoom order to status deliverd, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}. ${err.stack}`);
                                });
                            return;
                        }
                    })
                    .catch(err => {
                        log.error(`[catch] [axios] Set zoom order delivered, order _id: ${req.params._id}, zoom order number: ${req.body.zoomOrderNumber}\nresponse.hreaders: ${util.inspect(err.response.headers)}\nresponse.data: ${util.inspect(err.response.data)}\n${err.stack}`);
                        return res.json({success: false, errMessage: err.response.data});
                    }); 
            }        
        }
    }
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
		search = {
			status: { $in: JSON.parse(req.query.filter) }
		};
	}
	// Search by _id.
	else if (req.query.search.match(/^[a-f\d]{24}$/i)) {
		search = {
			status: { $in: JSON.parse(req.query.filter) },
			_id: req.query.search
		};
	}
	// No search by _id.
	else {
		search = {
			status: { $in: JSON.parse(req.query.filter) },
			$or: [
				{'name': {$regex: req.query.search, $options: 'i'}},
				{totalPrice: {$regex: req.query.search, $options: 'i'}},
				{'items.name': {$regex: req.query.search, $options: 'i'}},
			]
		}
	}
	// Find orders.
	let orderPromise = Order.find(search).sort({'timestamps.placedAt': -1}).skip(skip).limit(ORDER_QTD_BY_PAGE).exec();
	// Order count.
	let orderCountPromise = Order.find(search).countDocuments().exec();
	Promise.all([orderPromise, orderCountPromise])
		.then(([orders, count])=>{
			res.json({orders, page, pageCount: Math.ceil(count / ORDER_QTD_BY_PAGE)});
		}).catch(err=>{
			return next(err);
		});
});

// Change order status.
router.post('/api/order/status/:_id/:status', checkPermission, function(req, res, next) {
	// Find order.
	Order.findById(req.params._id, async (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			return next(new Error('Did not find order.')); }
		else {
			// Status to change.
			switch (req.params.status){
				case 'paid':
					order.status = 'paid';
					order.timestamps.paidAt = new Date();
                    // Confirm booking.
                    for(const item of order.items) {
                        if (item.dealerName == 'Allnations') {
                            await allnations.confirmBooking(item);
                        }
                    }
					break;
				case 'shipped':
					order.status = 'shipped';
					order.timestamps.shippedAt = new Date();
					break;
				case 'delivered':
					order.status = 'delivered';
					order.timestamps.deliveredAt = new Date();
					break;
				case 'canceled':
					order.status = 'canceled';
					order.timestamps.canceledAt = new Date();
					// Update stock.
					log.debug(`Order ${order._id}, update stock typeof: ${typeof(req.query.updateStock)}`);
					log.debug(`Order ${order._id}, update stock: ${req.query.updateStock}`);
					if (req.query.updateStock && req.query.updateStock == 'true') {
						for (let i = 0; i < order.items.length; i++) {
                            // Not update allnations stock, stock is updated by allantaions system.
                            if (order.items[i].dealerName != 'Allnations') {
					            log.debug(`Updating stock: order ${order._id}, product ${order.items[i]._id}, inc: ${order.items[i].quantity}`);
                                Product.updateOne({ _id: order.items[i]._id }, { $inc: { storeProductQtd: order.items[i].quantity }}, err=>{
                                    if (err) {
                                        log.error(err.stack);
                                    }
                                });
                            }
						}
					}
                    // Cancel booking.
                    for(const item of order.items) {
                        if (item.dealerName == 'Allnations') {
                            await allnations.cancelBooking(item);
                        }
                    }
					break;
				default:
					res.json({ err: 'No valid status.'})
					return;
			}
			// Save order.
			order.save(async (err, newOrder)=>{
				if (err) {
					res.json({err: err});
					return next(err);
				} else {
                    // Bookings
                    let bookings = [];
                    for(let i=0; i < newOrder.items.length;  i++) {
                        bookings.push({});
                        if (newOrder.items[i].dealerName == 'Allnations') {
                            let bookingResult = await allnations.getBooking(newOrder.items[i]);
                            if (bookingResult) {
                                bookings[i] = bookingResult;
                            }
                        }
                    };
					res.json({order: newOrder, bookings});
				}
			});
		}
	});
});


/******************************************************************************
/   INVOICE
 ******************************************************************************/
// Check if invoice is registred.
router.get('/invoice-by-order/:orderId/registred', checkPermission, (req, res, next)=>{
    try {
        Invoice.findOne({ 'orderId': new ObjectId(req.params.orderId) })
            .then(invoice=>{
                // Exist invoice.
                if (invoice) {
                    return res.json({ success: true, registred: true });
                } 
                // Not exist invoice.
                else {
                    return res.json({ success: true, registred: false });
                }
            }) 
            .catch(err=>{
                log.error(new Error(`get if invoice registred, order: ${req.params.orderId}. ${err.stack}`));
                return res.json({ success: false, errMessage: err.message });
            })
    } 
    catch(err) {
        log.error(new Error(`get if invoice registred, order: ${req.params.orderId}. ${err.stack}`));
        return res.json({ success: false, errMessage: err.message });
    }
});

// Get one invoice.
router.get('/invoice-by-order/:orderId', checkPermission, (req, res, next)=>{
    try {
        Invoice.findOne({ 'orderId': new ObjectId(req.params.orderId) })
            .then(invoice=>{
                // Signal to return to the order page with set status panel opened.
                let setStatus = req.query.setStatus? true: false
                // New invoice.
                if (!invoice) {
                    let invoice = {
                        _id: 'new',
                        orderId: req.params.orderId,
                        number: '',
                        accessKey: '',
                        cnpj: '15.178.404/0001-47',
                        issueDate: moment().format('YYYY-MM-DDTHH:mm'),
                        serie: '1',
                        url: '',
                        invalid: {}
                    }
                    return res.render('admin/editInvoice', { invoice: invoice, setStatus: setStatus });
                } 
                // Edit invoice.
                else {
                    invoice.invalid = {};
                    // log.debug(`invoice: ${JSON.stringify(invoice, null, 2)}`)
                    return res.render('admin/editInvoice', { invoice: invoice, setStatus: setStatus });
                }
            }) 
            .catch(err=>{
                return next(err);
            })
    } 
    catch(err) {
        return next(err);
    }
});

// Save invoice.
router.post('/invoice/:id', checkPermission, (req, res, next)=>{
    // log.debug(`req.body: ${JSON.stringify(req.body, null, 2)}`)
    let invoice = {
        _id: req.body._id,
        orderId: req.body.orderId,
        number: req.body.number,
        accessKey: req.body.accessKey,
        cnpj: req.body.cnpj,
        issueDate: req.body.issueDate,
        serie: req.body.serie,
        url: req.body.url,
        invalid: {}
    }
    // Check fields.
    // Number.
    if (!invoice.number.match(/^.{1,60}$/)) {
        invoice.invalid.number = 'Valor inválido'; 
    }
    // Access key.
    if (!invoice.accessKey.match(/^.{1,60}$/)) {
        invoice.invalid.accessKey = 'Valor inválido'; 
    }
    // CNPJ.
    if (cnpj.isValid(invoice.cnpj)) {
        invoice.cnpj = cnpj.format(invoice.cnpj);
    }
    else {
        invoice.invalid.cnpj = 'Valor inválido'; 
    }
    // Issue date.
    if (!invoice.issueDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        invoice.invalid.issueDate = 'Valor inválido'; 
    }
    // Serie.
    if (!invoice.serie.match(/^.{1,24}$/)) {
        invoice.invalid.serie = 'Valor inválido'; 
    }
    // URL.
    if (invoice.url.length > 100) {
        invoice.invalid.url = 'Valor inválido'; 
    }

    // Invalid fields.
    if (Object.keys(invoice.invalid).length) {
        return res.render('admin/editInvoice', { invoice: invoice });
    } 
    // Valid.
    else {
        delete invoice.invalid;
        // New.
        if (invoice._id == "new") { 
            delete invoice._id; 
            let invoiceBd = new Invoice(invoice);
            invoiceBd.save()
                .then(invoice=>{
                    let setStatus = req.body.setStatus? '?setStatus=true': '';
                    return res.redirect(`/admin/order/${invoice.orderId}${setStatus}`);
                })
                .catch(err=>{
                    return next(new Error(`Saving invoice ${invoice._id} from order ${invoice.orderId}. ${err}`));
                });
        } 
        // Edit existing one.
        else {
            // log.debug(`invoice._id: ${invoice._id}`);
            Invoice.findByIdAndUpdate(invoice._id, invoice)
                .then(()=>{
                    return res.redirect(`/admin/order/${invoice.orderId}`);
                })
                .catch(err=>{
                    return next(new Error(`Updating invoice ${invoice._id} from order ${invoice.orderId}. ${err}`));
                })
        }
    }
});

// Delete invoice.
router.delete('/invoice/:_id', checkPermission, (req, res, next)=>{
    Invoice.findByIdAndDelete(req.params._id)
        .then(invoice=>{
            return res.json({ success: true });
        })
        .catch(err=>{
            log.error(next(new Error(`Deleting invoice ${req.params._id}. ${err.stack}`)));
            return res.json({ success: false, errMessage: err });
        })
});


/******************************************************************************
/   USERS INFO
 ******************************************************************************/
// User list page.
router.get('/users', checkPermission, function(req, res, next) {
    // let [err, users, count] = getUsers('');
    getUsers('').then(val=>{
        let [err, users, totalUsers] = val;
        if (err) {
            return next(err);
        }
        res.render('admin/userList', { nav: {}, users, totalUsers });
    });
});

// User information page.
router.get('/user/:_id', checkPermission, function(req, res, next) {
    let promises = [
        User.findById(req.params._id).exec().catch(err=>{log.error(`Finding user. ${err}`)}),
        Order.find({ user_id: req.params._id }).sort({ createdAt: -1 }).limit(30).exec().catch(err=>{log.error(`Finding order. ${err}`)})
    ]
    Promise.all(promises)
        .then(([userInfo, orders])=>{
            res.render('admin/user', { nav: {}, userInfo, orders });
        }).catch(err=>{
            return next(err);
        });
});

// Get users.
router.get('/api/users', checkPermission, function(req, res, next) {
    getUsers(req.query.search).then(val=>{
        let [err, users, totalUsers] = val;
        if (err) {
            return next(err);
        }
        res.json({ users });
    });
});

// Get users from db.
async function getUsers(search) {
    search = search.trim();
    let filter = {};
    // Find orders.
    if (search) {
        filter = {
            $or: [
                { name: {$regex: search, $options: 'i'} },
                { email: {$regex: search, $options: 'i'} },
            ]
        };
    } 
    // Promises.
    let promises = [User.find(filter).sort({name: -1}).limit(10).exec()];
    // Only get total users count if no search (initial page reload).
    if (!search) {
        promises.push(User.find().countDocuments().exec());
    }
    return Promise.all(promises)
        .then(([users, totalUsers])=>{
            return [null, users, totalUsers];
        }).catch(err=>{
            return [err, null, null]
        });
};

/******************************************************************************
/   BANNERS
 ******************************************************************************/
// Get banners page.
router.get('/banner', (req, res, next)=>{
	redis.get('banners', (err, banners)=>{
		// Internal error.
		if (err) {
			return next(err);
		}
		// Render page.
		return res.render('admin/banner', {  banners: JSON.parse(banners) || [] });
	});
});

// Save banners.
router.post('/banner', checkPermission, (req, res, next)=>{
	let banners = JSON.stringify(req.body.banners);
	if (!banners) {
		banners = [];
	}
	redis.set('banners', banners, (err)=>{
		if (err) {
			log.error(new Error(err).stack);
			return;
		}
		else {
			log.info(`Banner updated.`);
			res.json({ success: true });
			// Sync upladed images with product.images.
			// Get list of uploaded images.
			fse.readdir(path.join(__dirname, '..', 'dist/banner'), (err, files)=>{
				console.debug(JSON.stringify(files));
				if (err) {
					log.error(err.stack);
				}
				else {
					// Remove uploaded images not in product images.
					files.forEach(function(file) {
						if (!banners.includes(file) && file !== '.gitkeep') {
							// Remove uploaded image.
							let fileToRemove = file;
							fse.remove(path.join(__dirname, '..', 'dist/banner', fileToRemove), err=>{
								if (err) { log.error(err.stack); }
							});
						}
					});
				}
			});
		}
	});
});

// Upload banner images.
router.put('/upload-banner-images', checkPermission, (req, res)=>{
	const form = formidable.IncomingForm();
	const DIR_IMG_BANNER = path.join(__dirname, '..', 'dist/banner');
	const MAX_FILE_SIZE_UPLOAD = 10 * 1024 * 1024;
	form.uploadDir = DIR_IMG_BANNER;
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
		log.error(err.stack);
		res.writeHead(413, {'connection': 'close', 'content-type': 'text/plain'});
		res.end(err);
		req.connection.destroy();
	});
	// All files have been uploaded.
	form.on('end', function() {
		res.json({images: form.images});
	});
	// Create folder if not exist and start upload.
	fse.ensureDir(DIR_IMG_BANNER, err=>{
		// Other erro than file alredy exist.
		if (err && err.code !== 'EEXIST') {
			log.error(err.stack);
		} else {
			form.parse(req);
		}
	});
});

/******************************************************************************
/   IMAGES
 ******************************************************************************/
// Get image page.
router.get('/image', (req, res, next)=>{
    // Get list of uploaded images.
    fse.readdir(path.join(__dirname, '..', 'dist/img/misc'), (err, images)=>{
        if (err) {
            log.error(err.stack);
        }
        else {
            // // Remove .gitkeep.
            for (let i=0; i < images.length; i++) {
                if (images[i] == '.gitkeep') {
                    images.splice(i,1);
                    break;
                }
            }
            return res.render('admin/image', {  images: images || [] });
        }
    });
});

// Delete image.
router.delete('/image/:image', checkPermission, (req, res, next)=>{
    // Delete image.
    fse.remove(path.join(__dirname, '..', 'dist/img/misc/', req.params.image), (err)=>{
        if (err) {
            log.error(err.stack);
            return res.status(500).send(err.stack);
        }
        else {
            return res.send();
        }
    });
});

// Upload images.
router.put('/image/', checkPermission, (req, res)=>{
	const form = formidable.IncomingForm();
	const DIR_IMG_BANNER = path.join(__dirname, '..', 'dist/img/misc');
	const MAX_FILE_SIZE_UPLOAD = 10 * 1024 * 1024;
	form.uploadDir = DIR_IMG_BANNER;
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
		log.error(err.stack);
		res.writeHead(413, {'connection': 'close', 'content-type': 'text/plain'});
		res.status(500).send(err);
		req.connection.destroy();
	});
	// All files have been uploaded.
	form.on('end', function() {
		res.send();
	});
	// Create folder if not exist and start upload.
	fse.ensureDir(DIR_IMG_BANNER, err=>{
		// Other erro than file alredy exist.
		if (err && err.code !== 'EEXIST') {
			log.error(err.stack);
		} else {
			form.parse(req);
		}
	});
});

/******************************************************************************
/   MOTOBY DELIVERY
 ******************************************************************************/
// Convert 3456 to R$ 34,56.
function brCurrencyFrom100XInt(val) {
    val = (val / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return  val;
}

// Convert 34,56 to 3456.
function brCurrencyTo100XInt(val) {
    val = val.replace('.', '').replace(',', '.');
    val = parseFloat(val, 10)
    return Math.ceil(val * 100)
}

// Get all motoboy freight.
router.get('/motoboy-freights', (req, res, next)=>{
    axios.get(`${s.freightServer.host}/motoboy-freights`, {
        headers: {
            "Accept": "application/json", 
        },
        auth: { 
            username: s.freightServer.user, 
            password: s.freightServer.password
        },
    })
    .then(response => {
        // log.debug(`response.data: ${JSON.stringify(response.data, null, 2)}`);
        // log.debug(`response.err: ${JSON.stringify(response.err, null, 2)}`);
        if (response.data && response.data.err) {
            log.error(new Error(`Getting motoboy freight from freight server. ${response.data.err}`));
        } else {
            // log.debug(`res.data: ${JSON.stringify(response.data, null, "")}`);
            return res.render('admin/motoboyFreights', {  freights: response.data || [], brCurrency: brCurrencyFrom100XInt });
        }
    })
    .catch(err => {
        log.error(err.stack);
    }); 
});

// Get motoboy freight.
router.get('/motoboy-freight/:id', checkPermission, (req, res, next)=>{
    try {
        // New.
        if (req.params.id === 'new') {
            let freight = {
                id: 'new',
                city: '',
                deadline: 1,
                price: 4000,
                invalid: {}
            }
            // log.debug(`new shippingPrice: ${JSON.stringify(shippingPrice, null, 2)}`);
            res.render('admin/editMotoboyFreight', { freight: freight, brCurrency: brCurrencyFrom100XInt });
        } 
        // Existing item.
        else {
            axios.get(`${s.freightServer.host}/motoboy-freight/${req.params.id}`, {
                headers: {
                    "Accept": "application/json", 
                },
                auth: { 
                    username: s.freightServer.user, 
                    password: s.freightServer.password
                },
            })
            .then(response => {
                if (response.data.err) {
                    return next(new Error(`Getting motoboy freight ${req.params.id} from freight server. ${response.data.err}`));
                } else {
                    // log.debug(`res.data: ${JSON.stringify(response.data, null, "")}`);
                    response.data.invalid = {}
                    return res.render('admin/editMotoboyFreight', { freight: response.data, brCurrency: brCurrencyFrom100XInt });
                }
            })
            .catch(err => {
                return next(new Error(`Getting motoboy freight ${req.params.id} from freight server. ${err.stack}`));
            }); 
        }
    } 
    catch(err) {
        return next(err);
    }
});

// Save/update motoboy freight.
router.post('/motoboy-freight/:id', checkPermission, (req, res, next)=>{
    // log.debug(`req.body: ${JSON.stringify(req.body, null, '  ')}`)

	// Validation for price and deadline.
    // Check fields.
    let invalid = {};
    // City.
    if (!req.body.city.match(/.{1,40}/)) {
        invalid.city = 'Valor inválido'; 
    }
    // Pice.
    if (!req.body.price.match(/^(\d+)(\.\d{3})*(\,\d{0,2})?$/)) {
        invalid.price = 'Valor inválido'; 
    }
    // Deadline.
    if (!req.body.deadline.match(/^\d{1,2}$/)) {
        invalid.deadline = 'Valor inválido'; 
    }
    // Invalid fields.
    if (Object.keys(invalid).length) {
        let freight = {
            id: req.body.id,
            city: req.body.city,
            deadline: req.body.deadline,
            price: req.body.price,
            invalid: invalid
        };
        return res.render('admin/editMotoboyFreight', { freight: freight, brCurrency: function doNothing(val){return val} });
    }

    let freight = {};
    freight.city = req.body.city;
    freight.deadline = parseInt(req.body.deadline, 10);
    freight.price = brCurrencyTo100XInt(req.body.price);
    // New freight.
    if (req.body.id == "new") {
        freight.id = 0;
        axios.post(`${s.freightServer.host}/motoboy-freight`, freight, {
            headers: {
                "Accept": "application/json", 
            },
            auth: { 
                username: s.freightServer.user, 
                password: s.freightServer.password
            }
        })
        .then(response => {
            if (response.data.err) {
                return next(new Error(`Creating motoboy freight id: ${req.params.id} on freight server. ${response.data.err}`));
            } else {
                return res.redirect('/admin/motoboy-freights');
            }
        })
        .catch(err => {
            return next(new Error(`Creating motoboy freight ${req.params.id} on freight server. ${err}`));
        }); 
    } 
    // Update freight.
    else {
        freight.id = parseInt(req.body.id, 10);
        axios.put(`${s.freightServer.host}/motoboy-freight`, freight, {
            headers: {
                "Accept": "application/json", 
            },
            auth: { 
                username: s.freightServer.user, 
                password: s.freightServer.password
            }
        })
        .then(response => {
            if (response.data.err) {
                return next(new Error(`Updating motoboy freight id: ${req.params.id} on freight server. ${response.data.err}`));
            } else {
                return res.redirect('/admin/motoboy-freights');
            }
        })
        .catch(err => {
            return next(new Error(`Updating motoboy freight ${req.params.id} on freight server. ${err}`));
        }); 
    }
});

// Delete motoboy freight.
router.delete('/motoboy-freight/:id', checkPermission, (req, res, next)=>{
    axios.delete(`${s.freightServer.host}/motoboy-freight/${req.params.id}`, {
        headers: {
            "Accept": "application/json", 
        },
        auth: { 
            username: s.freightServer.user, 
            password: s.freightServer.password
        }
    })
    .then(response => {
        if (response.data.err) {
            log.error(`Deleting motoboy freight ${req.params.id} on freight server. ${err}`);
            return res.sendStatus(500);
        } else {
            return res.send();
        }
    })
    .catch(err => {
        log.error(`Deleting motoboy freight ${req.params.id} on freight server. ${err}`);
        return res.sendStatus(500);
    }); 
});


/******************************************************************************
*   Region freight
******************************************************************************/
// Convert grams to kg, ex: 1600 to 1.
function grToKg(val) {
    val = val / 1000;
    return Math.floor(val);
}
// kg to gr.
function kgToGr(val) {
    return val * 1000;
}

// Get all region freight.
router.get('/region-freights', (req, res, next)=>{
    axios.get(`${s.freightServer.host}/region-freights`, {
        headers: {
            "Accept": "application/json", 
        },
        auth: { 
            username: s.freightServer.user, 
            password: s.freightServer.password
        },
    })
    .then(response => {
        // log.debug(`response.data: ${JSON.stringify(response.data, null, 2)}`);
        // log.debug(`response.err: ${JSON.stringify(response.err, null, 2)}`);
        if (response.data && response.data.err) {
            log.error(new Error(`Getting region freight from freight server. ${response.data.err}`));
        } else {
            // log.debug(`res.data: ${JSON.stringify(response.data, null, "")}`);
            return res.render('admin/regionFreights', {  freights: response.data || [], brCurrency: brCurrencyFrom100XInt, grToKg: grToKg });
        }
    })
    .catch(err => {
        log.error(err.stack);
    }); 
});

// Get one region freight.
router.get('/region-freight/:id', checkPermission, (req, res, next)=>{
    try {
        // New.
        if (req.params.id === 'new') {
            let freight = {
                id: 'new',
                region: 'north',
                deadline: 2,
                weight: 4000,
                price: 10000,
                invalid: {}
            }
            // log.debug(`new shippingPrice: ${JSON.stringify(shippingPrice, null, 2)}`);
            res.render('admin/editRegionFreight', { freight: freight, brCurrency: brCurrencyFrom100XInt, grToKg: grToKg});
        } 
        // Existing item.
        else {
            axios.get(`${s.freightServer.host}/region-freight/${req.params.id}`, {
                headers: {
                    "Accept": "application/json", 
                },
                auth: { 
                    username: s.freightServer.user, 
                    password: s.freightServer.password
                },
            })
            .then(response => {
                if (response.data.err) {
                    return next(new Error(`Getting region freight ${req.params.id} from freight server. ${response.data.err}`));
                } else {
                    // log.debug(`res.data: ${JSON.stringify(response.data, null, "")}`);
                    response.data.invalid = {}
                    return res.render('admin/editRegionFreight', { freight: response.data, brCurrency: brCurrencyFrom100XInt, grToKg: grToKg });
                }
            })
            .catch(err => {
                return next(new Error(`Getting region freight ${req.params.id} from freight server. ${err.stack}`));
            }); 
        }
    } 
    catch(err) {
        return next(err);
    }
});

// Save/update region freight.
router.post('/region-freight/:id', checkPermission, (req, res, next)=>{
    log.debug(`req.body: ${JSON.stringify(req.body, null, '  ')}`)

	// Validation for price and deadline.
    // Check fields.
    let invalid = {};
    // Pice.
    if (!req.body.price.match(/^(\d+)(\.\d{3})*(\,\d{0,2})?$/)) {
        invalid.price = 'Valor inválido'; 
    }
    // Weight.
    if (!req.body.weight.match(/^\d{1,3}$/)) {
        invalid.weight = 'Valor inválido'; 
    }
    // Deadline.
    if (!req.body.deadline.match(/^\d{1,2}$/)) {
        invalid.deadline = 'Valor inválido'; 
    }
    // Invalid fields.
    if (Object.keys(invalid).length) {
        let freight = {
            id: req.body.id,
            region: req.body.region,
            weight: req.body.weight,
            deadline: req.body.deadline,
            price: req.body.price,
            invalid: invalid
        };
        return res.render('admin/editRegionFreight', { freight: freight, brCurrency: function doNothing(val){return val}, grToKg: function doNothing(val){return val} });
    }

    let freight = {};
    freight.region = req.body.region;
    freight.weight = parseInt(req.body.weight, 10) * 1000;
    freight.deadline = parseInt(req.body.deadline, 10);
    freight.price = brCurrencyTo100XInt(req.body.price);
    // New freight.
    if (req.body.id == "new") {
        freight.id = 0;
        axios.post(`${s.freightServer.host}/region-freight`, freight, {
            headers: {
                "Accept": "application/json", 
            },
            auth: { 
                username: s.freightServer.user, 
                password: s.freightServer.password
            }
        })
        .then(response => {
            if (response.data.err) {
                return next(new Error(`Creating region freight id: ${req.params.id} on freight server. ${response.data.err}`));
            } else {
                return res.redirect('/admin/region-freights');
            }
        })
        .catch(err => {
            return next(new Error(`Creating region freight ${req.params.id} on freight server. ${err}`));
        }); 
    } 
    // Update freight.
    else {
        freight.id = parseInt(req.body.id, 10);
        axios.put(`${s.freightServer.host}/region-freight`, freight, {
            headers: {
                "Accept": "application/json", 
            },
            auth: { 
                username: s.freightServer.user, 
                password: s.freightServer.password
            }
        })
        .then(response => {
            if (response.data.err) {
                return next(new Error(`Updating region freight id: ${req.params.id} on freight server. ${response.data.err}`));
            } else {
                return res.redirect('/admin/region-freights');
            }
        })
        .catch(err => {
            return next(new Error(`Updating region freight ${req.params.id} on freight server. ${err}`));
        }); 
    }
});

// Delete region freight.
router.delete('/region-freight/:id', checkPermission, (req, res, next)=>{
    axios.delete(`${s.freightServer.host}/region-freight/${req.params.id}`, {
        headers: {
            "Accept": "application/json", 
        },
        auth: { 
            username: s.freightServer.user, 
            password: s.freightServer.password
        }
    })
    .then(response => {
        if (response.data.err) {
            log.error(`Deleting region freight ${req.params.id} on freight server. ${err}`);
            return res.sendStatus(500);
        } else {
            return res.send();
        }
    })
    .catch(err => {
        log.error(`Deleting region freight ${req.params.id} on freight server. ${err}`);
        return res.sendStatus(500);
    }); 
});

/******************************************************************************
*   Dealer freight
******************************************************************************/
// Get all dealer freight.
router.get('/dealer-freights', (req, res, next)=>{
    axios.get(`${s.freightServer.host}/dealer-freights`, {
        headers: {
            "Accept": "application/json", 
        },
        auth: { 
            username: s.freightServer.user, 
            password: s.freightServer.password
        },
    })
    .then(response => {
        // log.debug(`response.data: ${JSON.stringify(response.data, null, 2)}`);
        // log.debug(`response.err: ${JSON.stringify(response.err, null, 2)}`);
        if (response.data && response.data.err) {
            log.error(new Error(`Getting dealer freight from freight server. ${response.data.err}`));
        } else {
            // log.debug(`res.data: ${JSON.stringify(response.data, null, "")}`);
            return res.render('admin/dealerFreights', {  freights: response.data || [], brCurrency: brCurrencyFrom100XInt, grToKg: grToKg });
        }
    })
    .catch(err => {
        log.error(err.stack);
    }); 
});

// Get one dealer freight.
router.get('/dealer-freight/:id', checkPermission, (req, res, next)=>{
    try {
        // New.
        if (req.params.id === 'new') {
            let freight = {
                id: 'new',
                dealer: '',
                deadline: 2,
                weight: 4000,
                price: 10000,
                invalid: {}
            }
            // log.debug(`new shippingPrice: ${JSON.stringify(shippingPrice, null, 2)}`);
            res.render('admin/editDealerFreight', { freight: freight, brCurrency: brCurrencyFrom100XInt, grToKg: grToKg});
        } 
        // Existing item.
        else {
            axios.get(`${s.freightServer.host}/dealer-freight/${req.params.id}`, {
                headers: {
                    "Accept": "application/json", 
                },
                auth: { 
                    username: s.freightServer.user, 
                    password: s.freightServer.password
                },
            })
            .then(response => {
                if (response.data.err) {
                    return next(new Error(`Getting dealer freight ${req.params.id} from freight server. ${response.data.err}`));
                } else {
                    // log.debug(`res.data: ${JSON.stringify(response.data, null, "")}`);
                    response.data.invalid = {}
                    return res.render('admin/editDealerFreight', { freight: response.data, brCurrency: brCurrencyFrom100XInt, grToKg: grToKg });
                }
            })
            .catch(err => {
                return next(new Error(`Getting dealer freight ${req.params.id} from freight server. ${err.stack}`));
            }); 
        }
    } 
    catch(err) {
        return next(err);
    }
});

// Save/update dealer freight.
router.post('/dealer-freight/:id', checkPermission, (req, res, next)=>{
    log.debug(`req.body: ${JSON.stringify(req.body, null, '  ')}`)

	// Validation for price and deadline.
    // Check fields.
    let invalid = {};
    // Pice.
    if (!req.body.price.match(/^(\d+)(\.\d{3})*(\,\d{0,2})?$/)) {
        invalid.price = 'Valor inválido'; 
    }
    // Weight.
    if (!req.body.weight.match(/^\d{1,3}$/)) {
        invalid.weight = 'Valor inválido'; 
    }
    // Deadline.
    if (!req.body.deadline.match(/^\d{1,2}$/)) {
        invalid.deadline = 'Valor inválido'; 
    }
    // Invalid fields.
    if (Object.keys(invalid).length) {
        let freight = {
            id: req.body.id,
            dealer: req.body.dealer,
            weight: req.body.weight,
            deadline: req.body.deadline,
            price: req.body.price,
            invalid: invalid
        };
        return res.render('admin/editDealerFreight', { freight: freight, brCurrency: function doNothing(val){return val}, grToKg: function doNothing(val){return val} });
    }

    let freight = {};
    freight.dealer = req.body.dealer;
    freight.weight = parseInt(req.body.weight, 10) * 1000;
    freight.deadline = parseInt(req.body.deadline, 10);
    freight.price = brCurrencyTo100XInt(req.body.price);
    // New freight.
    if (req.body.id == "new") {
        freight.id = 0;
        axios.post(`${s.freightServer.host}/dealer-freight`, freight, {
            headers: {
                "Accept": "application/json", 
            },
            auth: { 
                username: s.freightServer.user, 
                password: s.freightServer.password
            }
        })
        .then(response => {
            if (response.data.err) {
                return next(new Error(`Creating dealer freight id: ${req.params.id} on freight server. ${response.data.err}`));
            } else {
                return res.redirect('/admin/dealer-freights');
            }
        })
        .catch(err => {
            return next(new Error(`Creating dealer freight ${req.params.id} on freight server. ${err}`));
        }); 
    } 
    // Update freight.
    else {
        freight.id = parseInt(req.body.id, 10);
        axios.put(`${s.freightServer.host}/dealer-freight`, freight, {
            headers: {
                "Accept": "application/json", 
            },
            auth: { 
                username: s.freightServer.user, 
                password: s.freightServer.password
            }
        })
        .then(response => {
            if (response.data.err) {
                return next(new Error(`Updating dealer freight id: ${req.params.id} on freight server. ${response.data.err}`));
            } else {
                return res.redirect('/admin/dealer-freights');
            }
        })
        .catch(err => {
            return next(new Error(`Updating dealer freight ${req.params.id} on freight server. ${err}`));
        }); 
    }
});

// Delete dealer freight.
router.delete('/dealer-freight/:id', checkPermission, (req, res, next)=>{
    axios.delete(`${s.freightServer.host}/dealer-freight/${req.params.id}`, {
        headers: {
            "Accept": "application/json", 
        },
        auth: { 
            username: s.freightServer.user, 
            password: s.freightServer.password
        }
    })
    .then(response => {
        if (response.data.err) {
            log.error(`Deleting dealer freight ${req.params.id} on freight server. ${err}`);
            return res.sendStatus(500);
        } else {
            return res.send();
        }
    })
    .catch(err => {
        log.error(`Deleting dealer freight ${req.params.id} on freight server. ${err}`);
        return res.sendStatus(500);
    }); 
});


////////////////////////////////////////////////////////////////////////////////
//  Dealer configuration
////////////////////////////////////////////////////////////////////////////////
router.get('/dealers', (req, res, next)=>{
    try {
        return res.render('admin/dealers', { dealerActivations: dealerUtil.getDealerActivations() });
    }
    catch(err) {
        log.error(err.stack);
    }
});

router.post('/dealers', checkPermission, (req, res, next)=>{
    try {
        for (let dealer in dealerUtil.getDealerActivations()) {
            if(req.body[dealer+'Activation'] == 'active') {
                dealerUtil.setDealerActivation(dealer, true);
            } else {
                dealerUtil.setDealerActivation(dealer, false);
            }
        }
        res.redirect('dealers');
        productUtil.updateCommercializeStatus();
        return;
    }
    catch(err) {
        log.error(err.stack);
    }
});

/******************************************************************************
/   MARKDOWN LIST
 ******************************************************************************/
// Show markdown list.
router.get('/markdown', checkPermission, (req, res, next)=>{
    Markdown.find({}, { name: true }).sort({ name: 1 })
        .then(docs=>{
            return res.render('admin/markdownList', { nav: {}, mds: docs });
        }) 
        .catch(err=>{
            return next(err);
        })
});

// Show specific markdown.
router.get('/markdown/:_id', checkPermission, (req, res, next)=>{
    try {
        // New.
        if (req.params._id === 'new') {
            let md = {
                _id: 'new',
                name: '',
                markdown: '',
            }
            // log.debug(`new shippingPrice: ${JSON.stringify(shippingPrice, null, 2)}`);
            res.render('admin/editMarkdown', { nav: {}, md: md });
        } 
        // Existing item.
        else {
            Markdown.findById(req.params._id, (err, md)=>{
                if (err) return next(err);
                if (!md) return next(new Error('Not found markdown id ${req.params._id}'));
                res.render('admin/editMarkdown', { nav: {}, md: md } );
            });
        }
    } 
    catch(err) {
        return next(err);
    }
});

// Save markdown.
router.post('/markdown/:_id', checkPermission, [
    check('name').isLength({ min: 1 }).withMessage('Nome não definido'),
    check('name').isLength({ max: 100 }).withMessage('Nome tem que ser menor que 100 carácters'),
    check('name').matches(/^\S+$/).withMessage('Nome não pode conter espaços'),
    check('markdown').isLength({ min: 1  }).withMessage('Markdown não definido'),
    check('markdown').isLength({ max: 10000 }).withMessage('Markdown tem que ser menor que 10000 carácters'),
],(req, res, next)=>{
    try {
        // log.debug(`req.body: ${JSON.stringify(req.body, null, 2)}`);
        // Check erros.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // log.debug(JSON.stringify(errors.array(), null, 2));
            return res.status(422).json({ erros: errors.array() });
        }
        // New.
        else if (req.params._id === 'new'){
            // Check if exist.
            Markdown.findOne({ name: req.body.name })
            .then(md=>{
                // log.debug(`md: ${JSON.stringify(md, null, 2)}`);
                // Name alredy in use.
                if (md) {
                    return res.status(422).json({ erros: errors.array() });
                }
                else {
                    Markdown.create({ name: req.body.name, markdown: req.body.markdown })
                    .then((newMarkdown)=>{
                        markdownCache.updateCache();
                        return res.send();
                    })
                    .catch(err=>{
                        log.error(`Saving new markdown. ${err}`);
                        return res.status(500).send();
                    });
                }
            })
            .catch(err=>{
                switch (err.message) {
                    case '1':
                        res.status(422).json({ erros: [{ msg: 'error message'}] });
                        break;
                    default:
                        log.error(`Saving new markdown. ${err}`);
                        return res.status(500).send();
                }
             });
        }
        // Update.
        else {
            // log.debug(`Updating markdown, id: ${JSON.stringify(req.params, null, 2)}`);
            Markdown.findByIdAndUpdate(req.params._id, { 
                $set: { 
                    name: req.body.name,
                    markdown: req.body.markdown,
                }
            })
            .then(()=>{
                markdownCache.updateCache();
                return res.send();
            })
            .catch(err=>{
                log.error(`Updating markdown, _id: ${req.params._id}. ${err}`);
                return res.status(500).send();
            });
         }
    } catch(err) {
        log.error(`Updating markdown, _id: ${req.params._id}. ${err}`);
        return res.status(500).send();

    }
});

// delete shipping price.
router.delete('/markdown/:_id', checkPermission, (req, res, next)=>{
    // Check erros.
    Markdown.findByIdAndDelete(req.params._id)
    .then(()=>{
        markdownCache.updateCache();
        return res.send();
    })
    .catch(err=>{
        log.error(`Deleting markdown. {$err}`);
        return res.status(500).send();
     });
});

module.exports = router;
