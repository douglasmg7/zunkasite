'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const path = require('path');
const fse = require('fs-extra');
const axios = require('axios');
const { check, validationResult } = require('express-validator/check');
const { exec } = require('child_process');
// File upload.
const formidable = require('formidable');
// To resize images.
const imageUtil = require('../util/image');
// Models.
const Product = require('../model/product');
const Order = require('../model/order');
const User = require('../model/user');
const ShippingPrice = require('../model/shippingPrice');
const Markdown = require('../model/markdown');
const markdownCache = require('../model/markdownCache');
// Lists.
const productCategories = require('../util/productCategories');
const productMakers = require('../util/productMakers.js');
// Redis.
const redis = require('../db/redis');
// Internal.
const s = require('../config/s');
// Max product quantity by Page.
const PRODUCT_QTD_BY_PAGE = 20;
// Max order quantity by Page.
const ORDER_QTD_BY_PAGE = 20;

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
		    ],
            'deletedAt': {$exists: false}
        }
		: {'deletedAt': {$exists: false}};
	// Promisse.
	// Find products.
	let productPromise = Product.find(search).sort({'storeProductTitle': 1}).skip(skip).limit(PRODUCT_QTD_BY_PAGE).exec();
	// Product count.
	let productCountPromise = Product.countDocuments(search).exec();
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
				dealerName: '',
				storeProductId: '',
				storeProductTitle: '',
				storeProductActive: true,
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
        if (product.deletedAt) {
            res.status(404).send('Produto removido.');
        } else {
            // log.debug(`warranties: ${JSON.stringify(markdownCache.warranties())}`);
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
	req.body.product.storeProductAdditionalInformation = req.body.product.storeProductAdditionalInformation.trim();
	// New product.
	if (req.params.productId === 'new') {
		let product = new Product(req.body.product);
		product.save((err, newProduct) => {
			if (err) {
				res.json({err});
				return next(err);
			} else {
				log.info(`Produto ${newProduct._id} was created.`);
				res.json({ isNew: true, product: newProduct });
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
								let img_0200 = pathObj.name + '_0200px' + pathObj.ext;
								let img_0300 = pathObj.name + '_0300px' + pathObj.ext;
								if ((file === image) || (file === img_0080) || (file === img_0200) || (file === img_0300)) {
									exist = true;
								}
							});
							// Uploaded image not in product images.
							if (!exist) {
								// Remove uploaded image.
								let fileToRemove = file;
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
            // Delete from zunkasrv.
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
        }).catch(err=>{
            log.error(`Deleting product, product _id: ${req.params._id}. ${err.stack}`);
            res.json(err);
        });
});

// // Delete a product.
// router.delete('/product/:_id', checkPermission, function(req, res) {
	// try{	
		// Product.findByIdAndRemove(req.params._id)
			// .then(result=>{
				// // Delete images dir.
				// fse.remove(path.join(__dirname, '..', 'dist/img/', req.params._id), err=>{
					// if (err) { log.error(err.stack); }
					// res.json({});
					// log.info(`Product ${req.params._id} deleted.`);
					// // Delete from zunkasrv.
					// if (result.dealerName = "Aldo") {
						// // Delete reference product on integration server.
						// // log.debug(`axios delete: ${s.zunkaServer.host}/${result.dealerName.toLowerCase()}/product/mongodb_id/${result.dealerProductId}`);
						// axios.delete(`${s.zunkaServer.host}/${result.dealerName.toLowerCase()}/product/mongodb_id/${result.dealerProductId}`, {
							// headers: {
								// "Accept": "text/plain", 
							// },
							// auth: {
								// username: s.zunkaServer.user,
								// password: s.zunkaServer.password
							// },
						// })
						// .then(response => {
							// if (response.data.err) {
								// log.err(`Deleting mongodbId from zunkasrv, code: ${result.dealerProductId}. ${response.data.err}`);
							// } 
						// })
						// .catch(err => {
							// log.error(`Deleting mongodbId from zunkasrv, code: ${result.dealerProductId}. ${err}`);
						// }); 
					// }
				// });
			// })
			// .catch(err=>{
				// log.error(err.stack);
				// res.json(err);
			// });
	// } catch(err) {
		// log.error(`Deleting product, product _id: ${req.params._id}. ${err}`);
	// }
// });

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
router.get('/order/:_id', checkPermission, function(req, res, next) {
    let promises = [
        Order.findById(req.params._id).exec().catch(err=>{log.error(`Finding order by id. ${err}`)})
    ]
    Promise.all(promises)
        .then(([order])=>{
            // Order exist.
            if (order) {
                return res.render('admin/order', { nav: {}, order });
            }
            // Order not exist.
            else {
                return res.status(410).send(`Pedido não existe.`);
            }
        }).catch(err=>{
            return next(err);
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
	Order.findById(req.params._id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			return next(new Error('Did not find order.')); }
		else {
			// Status to change.
			switch (req.params.status){
				case 'paid':
					order.status = 'paid';
					order.timestamps.paidAt = new Date();
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
					if (req.query.updateStock) {
						for (let i = 0; i < order.items.length; i++) {
							Product.updateOne({ _id: order.items[i]._id }, { $inc: { storeProductQtd: order.items[i].quantity }}, err=>{
								if (err) {
									log.error(err.stack);
								}
							});
						}
					}
					break;
				default:
					res.json({ err: 'No valid status.'})
					return;
			}
			// Save order.
			order.save((err, newOrder)=>{
				if (err) {
					res.json({err: err});
					return next(err);
				} else {
					res.json({order: newOrder});
				}
			});
		}
	});
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
/   MOTOBY DELIVERY
 ******************************************************************************/

// Get motoboy delivery page.
router.get('/motoboy-delivery', (req, res, next)=>{
	redis.get('motoboy-delivery', (err, motoboyDeliveries)=>{
		// Internal error.
		if (err) {
			return next(err);
		}
		// Render page.
		return res.render('admin/motoboyDelivery', {  motoboyDeliveries: JSON.parse(motoboyDeliveries) || [] });
	});
});

// Save motoboy delivery.
router.post('/motoboy-delivery', checkPermission, (req, res, next)=>{
	// Validation for price and deadline.
	for(let i=0; i < req.body.motoboyDeliveries.length; i++ ) {
		if (!req.body.motoboyDeliveries[i].price.match(/^(\d+)(\.\d{3})*(\,\d{0,2})?$/) || !req.body.motoboyDeliveries[i].deadline.match(/^\d+$/)) {
			res.json({ success: false });
			return;
		}
		else {
			req.body.motoboyDeliveries[i].cityNormalized = req.body.motoboyDeliveries[i].city.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
		}
	}
	// Stringify.
	let motoboyDeliveries = JSON.stringify(req.body.motoboyDeliveries);
	if (!motoboyDeliveries) {
		motoboyDeliveries = [];
	}
	// Save.
	redis.set('motoboy-delivery', motoboyDeliveries, (err)=>{
		if (err) {
			log.error(new Error(err).stack);
			return;
		}
		else {
			log.info(`Motoboy delivery updated.`);
			res.json({ success: true });
		}
	});
});

/******************************************************************************
/   SHIPPING PRICE LIST
 ******************************************************************************/
// Shipping price list.
router.get('/shipping/prices', checkPermission, (req, res, next)=>{
    try {
        ShippingPrice.find().sort({ region: 1, deadline: 1, maxWeight: 1, price: 1 })
            .then(docs=>{
                if (!docs.length){
                    return next(new Error('No shipping price doc on db.'));
                }
                let regions = {
                    north: { name: 'Norte', items: [] },
                    northeast: { name: 'Nordeste', items: [] },
                    midwest: { name: 'Centro-oeste', items: [] },
                    southeast: { name: 'Sudeste', items: [] },
                    south: { name: 'Sul', items: [] }
                };
                docs.forEach(item=>{
                    regions[item.region].items.push({
                        _id: item._id,
                        deadline: `${item.deadline} dia(s)`,
                        maxWeight:  `${toKg(item.maxWeight)} kg`,
                        price: `${toReal(item.price)}`
                    });
                });
                return res.render('admin/shippingPrice', { nav: {}, regions: regions });
            }) 
            .catch(err=>{
                return next(err);
            })
    } 
    catch(err) {
        return next(err);
    }
});

// Convert decimal * 100 to real (1.000.000,00).
function toReal(val) {
    return 'R$ ' + (val / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
// Convert grams to kg, despise decimal part. 
function toKg(val) {
    return (val / 1000).toFixed(0);
};
// Padding with &nbsp;.
function padNbspStart(val, padSize) {
    val = val.toString();
    return '&nbsp; '.repeat(padSize - val.length) + val;
};

// Shipping price.
router.get('/shipping/price/:_id', checkPermission, (req, res, next)=>{
    try {
        // New.
        if (req.params._id === 'new') {
            let shippingPrice = {
                _id: 'new',
                region: 'north',
                deadline: 10,
                maxWeight: 100000,
                price: 10000
            }
            // log.debug(`new shippingPrice: ${JSON.stringify(shippingPrice, null, 2)}`);
            res.render('admin/editShippingPrice', { nav: {}, shippingPrice: shippingPrice });
        } 
        // Existing item.
        else {
            ShippingPrice.findById(req.params._id, (err, shippingPrice)=>{
                if (err) return next(err);
                if (!shippingPrice) return next(new Error('Not found shipping price id ${req.params._id}'));
                res.render('admin/editShippingPrice', { nav: {}, isNewShippingPrice: false, shippingPrice: shippingPrice } );
            });
        }
    } 
    catch(err) {
        return next(err);
    }
});

// Save shipping price.
router.post('/shipping/price/:_id', checkPermission, [
    // check('dealerName').isLength(4, 20),
    check('region').isIn(['north', 'northeast', 'midwest', 'southeast', 'south']).withMessage('Valor inválido para região'),
    check('deadline').isInt({ min: 1, max: 90 }).withMessage('Valor inválido para prazo'),
    // Max 100kg
    check('maxWeight').isInt({ min: 1, max: 100000 }).withMessage('Valor inválido para peso máximo'),
    // Max R$1.000.000,00
    check('price').isInt({ min: 1, max: 100000000 }).withMessage('Valor inválido para preço'),
],(req, res, next)=>{
    // log.debug(`req.body: ${JSON.stringify(req.body, null, 2)}`);
    // Check erros.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // log.debug(JSON.stringify(errors.array(), null, 2));
        return res.status(422).json({ erros: errors.array() });
    }
    // Save new shipping price.
    else if (req.params._id === 'new'){
        ShippingPrice.findOne({ region: req.body.region, deadline: req.body.deadline, maxWeight: req.body.maxWeight })
        .then(existingShippingPrice=>{
            if (existingShippingPrice) {
                throw new Error('1');
            }
        })
        .then(()=>{
            ShippingPrice.create({ region: req.body.region, deadline: req.body.deadline, maxWeight: req.body.maxWeight, price: req.body.price })
                .then((newShippingPrice)=>{
                    return res.send();
                })
        })
        .catch(err=>{
            switch (err.message) {
                case '1':
                    res.status(422).json({ erros: [{ msg: 'Frete já existe'}] });
                    break;
                default:
                    log.error(`Saving new shipping price. ${err}`);
                    return res.status(500).send();
            }
         });
    }
    // Update shipping price.
    else {
        // log.debug(`Updating shipping price, id: ${JSON.stringify(req.params, null, 2)}`);
        ShippingPrice.findByIdAndUpdate(req.params._id, { 
            $set: { 
                region: req.body.region,
                deadline: req.body.deadline,
                price: req.body.price,
                maxWeight: req.body.maxWeight,
            }
        })
        .then(()=>{
            return res.send();
        })
        .catch(err=>{
            log.error(`Updating shipping price, _id: ${req.params._id}`);
            return res.status(500).send();
        });
     }
});

// delete shipping price.
router.delete('/shipping/price/:_id', checkPermission, (req, res, next)=>{
    // Check erros.
    ShippingPrice.findByIdAndDelete(req.params._id)
    .then(()=>{
        return res.send();
    })
    .catch(err=>{
        log.error(`Deleting shipping price. {$err}`);
        return res.status(500).send();
     });
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
