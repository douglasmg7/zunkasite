'use strict';
const express = require('express');
const router = express.Router();
const passport = require('passport');
const emailSender = require('../config/email');
const soap = require('soap');
// const cpf = require('@fnando/cpf');
const cpf = require("@fnando/cpf/commonjs")
const cnpj = require("@fnando/cnpj/commonjs");
// const cnpj = require('@fnando/cnpj');
// const https = require('https');
// const request = require('request');
const axios = require('axios');
const qs = require('querystring');

// Personal modules.
const log = require('../config/log');
const s = require('../config/s');
const User = require('../model/user');
const Address = require('../model/address');
const Order = require('../model/order');
const Product = require('../model/product');
const ShippingPrice = require('../model/shippingPrice');
const ppConfig = require('../config/s').paypal;
const aldo = require('../util/aldo');
const allnations = require('../util/allnations.js');
const mobileNumber = require('../util/mobileNumber');

// Redis.
const redis = require('../db/redis');

// CEP origin, Rua Bicas - 31030160.
const CEP_ORIGIN = '31030160';
// const STANDARD_DELIVERY_DEADLINE = 10;
// const STANDARD_DELIVERY_PRICE = '60.00';

module.exports = router;

// Format number to money format.
function formatMoney(val){
	return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Convert to brazilian currency.
function converToBRCurrencyString(val) {
	return val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Convert to brazilian currency from number.
function toBrCurrency(val) {
	return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Convert to days string.
function toDays(val) {
    if (val > 1) {
        return val + ' dias';
    }
    return "1 dia";
}

// Check permission.
function checkPermission (req, res, next) {
	// Should be admin.
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/user/signin');
}

// Check not logged.
function checkNotLogged (req, res, next) {
	// Should be admin.
	if (!req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}

// Shipping address page.
router.get('/shipping-address', (req, res, next)=>{
	if (req.user) {
        if (!req.cart.products.length) {
            return res.redirect('/cart');
        }
		Address.find({ user_id: req.user._id }, (err, addresss)=>{
			if (err) return next(err);
			let newAddress = new Address();
			res.render('checkout/shippingAddress', {
				nav: {
				},
				addresss,
			});
		});
	} else {
		req.flash('redirect-signin-complete', 'cart');
		res.render('user/signin', { nav: {}, warnMessage: '', successMessage: ''});
	}

});

// Ship address selected.
router.post('/shipping-address', (req, res, next)=>{
	if (!req.cart.products.length) {
    	return res.json({emptyCart: true});
    }
	// Existing address selected.
	if (req.body.address_id) {
		// Create order.
		createOrder(req.body.address_id);
	}
	// New address selected.
	else {
		// Validation.
		req.sanitize("newAddress.name").trim();
		req.sanitize("newAddress.cep").trim();
		req.sanitize("newAddress.address").trim();
		req.sanitize("newAddress.addressNumber").trim();
		req.sanitize("newAddress.district").trim();
		req.sanitize("newAddress.city").trim();
		req.sanitize("newAddress.state").trim();
		req.sanitize("newAddress.phone").trim();
		req.checkBody('newAddress.name', 'Campo deve ser preenchido').notEmpty();
		req.checkBody('newAddress.cep', 'Campo deve ser preenchido').notEmpty();
		req.checkBody('newAddress.address', 'Campo deve ser preenchido').notEmpty();
		req.checkBody('newAddress.addressNumber', 'Campo deve ser preenchido').notEmpty();
		req.checkBody('newAddress.district', 'Campo deve ser preenchido').notEmpty();
		req.checkBody('newAddress.city', 'Campo deve ser preenchido').notEmpty();
		req.checkBody('newAddress.state', 'Campo deve ser preenchido').notEmpty();
		req.checkBody('newAddress.phone', 'Campo deve ser preenchido').notEmpty();
		req.getValidationResult().then(function(result) {
			// Send validations errors to client.
			if (!result.isEmpty()) {
				res.json({validation: result.array()});
				return;
			}
			// Save address.
			else {
				let address = new Address(req.body.newAddress);
				address.user_id = req.user._id;
				address.save((err, newAddress) => {
					if (err) {
						res.json({err});
						return next(err);
					} else {
						log.info(`Address ${newAddress._id} saved.`);
						// Create order.
						createOrder(address._id);
					}
				});
			}
		});
	}
	// Create order.
	function createOrder(address_id){
		// Find selected address.
		Address.findOne({ _id: address_id}, (err, address)=>{
			if (err) return next(err);
			// Remove order not placed yet, to start from begin again.
			Order.deleteMany({user_id: req.user._id, 'timestamps.placedAt': {$exists: false}}, err=>{
				if (err) return next(err);
				// Get products itens.
				let items = []
				for (var i = 0; i < req.cart.products.length; i++) {
					let item = {
						_id: req.cart.products[i]._id,
						name: req.cart.products[i].title,
                        dealerName: req.cart.products[i].dealerName,
                        dealerProductId: req.cart.products[i].dealerProductId,
						quantity: req.cart.products[i].qtd,
						price: req.cart.products[i].price.toFixed(2),
						length: req.cart.products[i].length,
						height: req.cart.products[i].height,
						width: req.cart.products[i].width,
						weight: req.cart.products[i].weight
					}
					items.push(item);
				}
				// Create a new order.
				let order = new Order();
				order.items = items;
				order.subtotalPrice = req.cart.totalPrice.toFixed(2);
				order.user_id = req.user._id;
				order.name = req.user.name;
				order.email = req.user.email;
				order.cpf = req.user.cpf;
				order.cnpj = req.user.cnpj;
				order.stateRegistration = req.user.stateRegistration;
				order.contactName = req.user.contactName;
				order.mobileNumber = req.user.mobileNumber;
				order.timestamps = { shippingAddressSelectedAt: new Date() };
				order.status = 'shippingAddressSelected';
				order.shipping = { address: {} };
				order.shipping.address.name = address.name;
				order.shipping.address.cep = address.cep;
				order.shipping.address.phone = address.phone;
				order.shipping.address.address = address.address;
				order.shipping.address.addressNumber = address.addressNumber;
				order.shipping.address.addressComplement = address.addressComplement;
				order.shipping.address.district = address.district;
				order.shipping.address.city = address.city;
				order.shipping.address.state = address.state;
				order.save(err=>{
					if (err) {
						res.json({ err: err })
					} else {
						res.json({ order_id: order._id });
					}
				});
			});
		})
	};
});

// Select shipment - page.
router.get('/shipping-method/order/:order_id', (req, res, next)=>{
	// Find order not placed yet.
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) { return next(new Error('No order to continue with shipping method selection.')); }
        // Order already placed.
        if (order.timestamps.placedAt) { return res.redirect('/user/orders'); }
		else {
			// Calculate box size shipment approximately.
			let shippingBox = { dealer: "", cepOrigin: CEP_ORIGIN, cepDestiny: order.shipping.address.cep, length: 0, height: 0, width: 0, weight: 0, price: 0 };
            order.shipping.allProductFromZunka = true;
			// For each item.
			for (let i = 0; i < order.items.length; i++) {
                // If some product is from outside zunka wherehouse.
                if (order.items[i].dealerName === 'Aldo' || order.items[i].dealerName === 'Allnations'){
                    order.shipping.allProductFromZunka = false;
                }
                // Dealer name.
                if (order.items[i].dealerName != "") {
                    shippingBox.dealer = order.items[i].dealerName;
                }
				// Get dimensions.
				let dimemsions = [order.items[i].length, order.items[i].height, order.items[i].width];
				// Sort dimensions.
				dimemsions = dimemsions.sort(function (a,b){
					if (a < b) { return -1 }
					if (a > b) { return 1 }
					return 0;
				});
				// Get the big dimension for the box.
				if (dimemsions[2] > shippingBox.length) { shippingBox.length = dimemsions[2]; }
				if (dimemsions[1] > shippingBox.height) { shippingBox.height = dimemsions[1]; }
				shippingBox.width += dimemsions[0];
				shippingBox.weight += order.items[i].weight;
                // Price.
                shippingBox.price += parseFloat(order.items[i].price);
			}
            // Box shipping dimensions.
            order.shipping.box = shippingBox;

            // Get freights values.
            axios.get(`${s.freightServer.host}/freights/zunka`, {
                headers: {
                    "Accept": "application/json", 
                },
                auth: { 
                    username: s.freightServer.user, 
                    password: s.freightServer.password
                },
                data: shippingBox
            })
            .then(response => {
                if (response.data.err) {
		            return next(new Error(`Getting shipping method. Estimating freight for pack ${JSON.stringify(shippingBox, null, 2)}. ${response.data.err}`));
                } else {
                    // log.debug(`response.data: ${JSON.stringify(response.data, null, 2)}`);

                    // todo - remove.
                    // Motoboy.
                    order.shipping.motoboyResult = { price: '', deadline: '' };
                    // Default.
                    order.shipping.defaultDeliveryResults = [];
                    // Correios.
                    order.shipping.correioResult = {};
                    order.shipping.correioResults = [];
                    // end - remove.

                    // All freights.
                    order.shipping.freights = [];
                    let freights = response.data;
                    let paymentOptionsTexts = [];
                    for (let i=0; i < freights.length; i++) {
                        let paymentOptions = ['transfer'];
                        let text = 'Opção de pagamento por transferência bancária';
                        // Motoboy.
                        if (freights[i].carrier.toLowerCase() === 'motoboy' ) {
                            if (order.shipping.allProductFromZunka){
                                paymentOptions.push('money', 'card-pres');
                                // text += ', dinheiro ou cartão de crédito no momento da entrega';
                                text += ', dinheiro ou cartão a vista no momento da entrega';
                            }
                        } 
                        // Correios or shipping company.
                        else {
                            paymentOptions.push('credit', 'paypal');
                            text += ', cartão de crédito parcelado ou PayPal';
                        }
                        paymentOptionsTexts.push(text);
                        order.shipping.freights.push({
                            id: i + 1,
                            carrier: freights[i].carrier,
                            serviceCode: freights[i].serviceCode,
                            serviceDesc: freights[i].serviceDesc,
                            deadline: freights[i].deadline,
                            price: freights[i].price,
                            paymentOptions: paymentOptions,
                        });
                    }
                    // log.debug(`freights: ${JSON.stringify(paymentOptionsTexts, null, 2)}`);
                    // Save order.
                    order.save(err=>{
                        if (err) {
                            res.json({err});
                            return next(err);
                        } else {
                            res.render('checkout/shippingMethod', 
                                { 
                                    order, 
                                    toBrCurrency: toBrCurrency, 
                                    toDays: toDays,
                                    paymentOptionsTexts: paymentOptionsTexts
                                });
                        }
                    });
                }
            })
            .catch(err => {
                return next(new Error(`Getting shipping method. Estimating freight for pack ${JSON.stringify(shippingBox, null, 2)}. ${err.stack}`));
            }); 
		}
	});
});

// Check if all products orders in stock.
async function checkOrderProductsInStock(order, cb) {
    // Promises.
    let promises = [];
    // Check stock for each item on order.
    order.items.forEach(item=>{
        promises.push(new Promise((resolve, reject)=>{
            Product.findById(item._id)
            .then(product=>{
                if (product.dealerName == "Aldo") {
                    aldo.checkAldoProductQty(product, item.quantity, (err, inStock)=>{
                        if (err) {
                            reject(err);
                        }
                        resolve([inStock, product]);
                    });
                } else if (product.dealerName == "Allnations") {
                    allnations.checkStock(product, item.quantity, (err, inStock)=>{
                        if (err) {
                            reject(err);
                        }
                        resolve([inStock, product]);
                    });
                } else {
                    // Not Aldo product, trust on system cadastre.
                    resolve([true, product]);
                }
            })
            .catch(err=>{
                reject(err);
            })
        }));
    });
    // Return promise.
    return Promise.all(promises)
        .then((results)=>{
            let productsOutOfStock = [];
            results.forEach(result=>{
                let [inStock, product] = result;
                // Some product out of stock.
                if (!inStock) {
                    productsOutOfStock.push(product);
                }
            });
            // All products in stock.
            if (productsOutOfStock.length) {
                return [false, productsOutOfStock];
            } else {
                return [true, null];
            }
        }).catch(err=>{
            log.error(`Checking aldo product in stock. ${err.stack}`);
            return false;
        });
}

// Select shipment.
router.post('/shipping-method/order/:order_id', (req, res, next)=>{
    // log.debug(`req.body: ${JSON.stringify(req.body)}`);
	Order.findById(req.params.order_id, (err, order)=>{
        if (!order) {
            return res.json({ success: false, message: "Pedido não existe\nVocê será redirecionado ao seu carrinho de compras."});
        }
        // Order already placed.
        else if (order.timestamps.placedAt) {
            return res.json({ success: false, message: "Pedido já foi confirmado.\nVocê será redirecionado ao seu carrinho de compras."});
        }
        // Check if all products in stock.
         checkOrderProductsInStock(order)
         .then(result=>{
            let [inStock, productsOutOfStock] = result; 
            // Not in stock.
            if (!inStock) {
                let message;
                // More than one item.
                if (productsOutOfStock.length > 1) {
                    message = "Os seguintes itens não estãm mais disponíveis na quantidade selecionada:\n\n";
                // One item.
                } else {
                    message = "O seguinte item não esta mais disponível na quantidade selecionada:\n\n";
                }
                productsOutOfStock.forEach(product=>{
                    message += "* " + product.storeProductTitle + "\n";
                });
                message += "\nVocê será redirecionado ao seu carrinho de compras.";
                res.json({ success: false, message});
            }
            // In stock.
            else {
                // log.debug(`req.body: ${JSON.stringify(req.body)}`);
                let selFreightIndex = parseInt(req.body.selFreightIndex);
                let selCarrier = order.shipping.freights[selFreightIndex].carrier;
                // log.debug(`selCarrier: ${selCarrier}`);
                order.shipping.deadline = order.shipping.freights[selFreightIndex].deadline;
                order.shipping.price = order.shipping.freights[selFreightIndex].price.toFixed(2);
                order.shipping.paymentOptions = order.shipping.freights[selFreightIndex].paymentOptions;
                // Motoboy.
                if (selCarrier == 'Motoboy'){
                    order.shipping.carrier = 'Motoboy';
                    // order.shipping.methodDesc = 'Motoboy';
                } 
                // Transportadora.
                else if (selCarrier.startsWith('Transportadora')) {
                    order.shipping.carrier = 'Transportadora';
                    // order.shipping.methodCode = parseInt(selCarrier.replace('Transportadora ', ""));
                    // order.shipping.methodDesc = selCarrier;
                }
                // Correios.
                else if (selCarrier = 'Correios') {
                    log.debug(`freight: ${JSON.stringify(order.shipping.freights[selFreightIndex], null, 2)}`);
                    order.shipping.carrier = 'Correios';
                    order.shipping.methodCode = order.shipping.freights[selFreightIndex].serviceCode;
                    order.shipping.methodDesc = order.shipping.freights[selFreightIndex].serviceDesc;
                }
                order.totalPrice = (parseFloat(order.subtotalPrice) + parseFloat(order.shipping.price)).toFixed(2);
                order.timestamps.shippingMethodSelectedAt = new Date();
                order.status = 'shippingMethodSelected';
                // log.debug(`order.shipping: ${JSON.stringify(order.shipping, null, 2)}`);
                order.save(err=>{
                    if (err) { return next(err) };
                    res.json({ success: true });
                });
            } 
        })
        .catch(err=>{
            log.error(`POST /shipping-method/order/:order_id. ${err.stack}`);
            return next(err);
            // res.status(500).send();
        });    
	});
});

// check if CPF or CNPJ resgistred and mobile number.
function checkCpfCnpjMobileRegistred(user) {
    return ((user.cpf != "" || user.cnpj != "") && user.mobileNumber != "");
}

// Payment - page.
router.get('/payment/order/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			return next(new Error('No order to continue with payment.')); }
        // Order already placed.
        if (order.timestamps.placedAt) {
	        return res.redirect('/user/orders');
        }
		// Must have cpf and mobile number ou cnpj and mobile number.
        if (!checkCpfCnpjMobileRegistred(req.user)) {
            res.render('checkout/needMoreInformation',
                {
                    registryType: '',
                    cpf: "",
                    cnpj: "",
                    stateRegistration: "",
                    contactName: "",
                    mobileNumber: "",
                    orderId: req.params.order_id,
                    invalid: {}
                }
            )
        }
        // Render payment page.
        else {
            res.render('checkout/payment',
                {
                    order: order,
                    nav: {
                    },
                    client: {
                        sandbox: ppConfig.sandbox.ppClientId,
                        production: ppConfig.production.ppClientId
                    },
                    env: (process.env.NODE_ENV === 'production' ? 'production': 'sandbox')
                }
            );
        }
	});
});

// Need more information.
router.post('/need-more-information/:orderId', checkPermission, (req, res, next)=>{
    // Invalid fields.
    let invalid = {};
    let invalidNumberMsg = "Ops! Este número não é valido.";
    // Type of registry.
    if (req.registryType != "") {
        // Mobile number.
        if (!mobileNumber.isValid(req.body.mobileNumber)) {
            invalid.mobileNumber = invalidNumberMsg;
        }     
    } else {
        invalid.registryType = "Tipo de registro não selecionado.";
    }
    // CPF.
    if (req.body.registryType == 'cpf') {
        if (!cpf.isValid(req.body.cpf)) {
            invalid.cpf = invalidNumberMsg;
        }
    } 
    // CNPJ.
    else if (req.body.registryType == 'cnpj') {
        if (!cnpj.isValid(req.body.cnpj)) {
            invalid.cnpj = invalidNumberMsg;
        }
        // State registration.
        if (req.body.stateRegistration.length > 100) {
            invalid.stateRegistration = invalidNumberMsg;
        }
        // Name for contact.
        if (req.body.contactName.length < 3) {
            invalid.contactName = "Ops! Este nome não é valido.";
        }
    } 
    // Invalid fields.
    if (Object.keys(invalid).length) {
        // console.log(`invalid: ${JSON.stringify(invalid, null, 2)}`);
        return res.render('checkout/needMoreInformation', {
            invalid: invalid,
            registryType: req.body.registryType,
            cpf: req.body.cpf,
            cnpj: req.body.cnpj,
            stateRegistration: req.body.stateRegistration,
            contactName: req.body.contactName,
            mobileNumber: req.body.mobileNumber,
            orderId: req.params.orderId 
        });
    }
    // Save cpf.
    else {
        // Save user data.
        User.findById(req.user._id, (err, user)=>{
            if (err) { return next(err) };
            if (!user) { return next(new Error('Not found user to save.')); }
            // CPF.
            if (req.body.registryType == 'cpf') {
                user.cpf = cpf.format(req.body.cpf);
            } 
            // CNPJ.
            else if(req.body.registryType == 'cnpj') {
                user.cnpj = cnpj.format(req.body.cnpj);
                user.stateRegistration = req.body.stateRegistration;
                user.contactName = req.body.contactName;
            }
            user.mobileNumber = mobileNumber.format(req.body.mobileNumber);
            user.save(function(err) {
                if (err) { return next(err); }
                // Save order data.
                Order.findById(req.params.orderId, (err, order)=>{
                    if (err) { return next(err) };
                    if (!order) { return next(new Error('Not found order to save cpf and mobile number.')); }
                    // CPF.
                    if (req.body.registryType == 'cpf') {
                        order.cpf = cpf.format(req.body.cpf);
                    } 
                    // CNPJ.
                    else if(req.body.registryType == 'cnpj') {
                        order.cnpj = cnpj.format(req.body.cnpj);
                        order.stateRegistration = req.body.stateRegistration;
                        order.contactName = req.body.contactName;
                    }
                    order.mobileNumber = mobileNumber.format(req.body.mobileNumber);
                    order.save(function(err) {
                        if (err) { return next(err); }
                        return res.redirect(`/checkout/payment/order/${order._id}`);
                    });
                });
            });
        });
    }
});

// Payment.
router.post('/payment/order/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) { 
            return res.json({ success: false, message: "Pedido não existe." });
            // return next(new Error('No order to continue with payment.')); 
        }
        // Order already placed.
        if (order.timestamps.placedAt) { 
            return res.json({ success: false, message: "Pedido já foi finalizado anteriormente." });
            // return next(new Error(`Order ${order._id} already closed.`)); 
        }
		switch(req.query.method) {
			case 'paypal':
				order.status = 'placed';
				order.timestamps.placedAt = new Date();
                try{
                    if (req.body.payment.transactions[0].related_resources[0].sale.state.toLowerCase() == "completed") {
                        order.status = 'paid';
                        order.timestamps.paidAt = order.timestamps.placedAt;
                    }
                } catch(err) {
                    log.error(`Getting payment completed for order ${order._id}`);
                }
				order.payment = {
					paypal: req.body.payment,
					method: 'paypal'
				};
				// order.status = 'paid';
				// order.timestamps.placedAt = new Date();
				// order.timestamps.paidAt = order.timestamps.placedAt;
				// order.payment = {
					// paypal: req.body.payment,
					// method: 'paypal'
				// };
				closeOrder(order, req, res);
				break;
			case 'money':
				order.payment = {
					method: 'money'
				};
				break;
			case 'card-machine':
				order.payment = {
					method: 'card-machine'
				};
				break;
			case 'transfer':
				order.payment = {
					method: 'transfer'
				};
				break;
			case 'ppp-credit':
				order.payment = {
					method: 'ppp-credit'	
				};
				createPayment(order, err=>{
					if (err) {
						return next(new Error(`Error creating payment. ${err.message}`));
					}
					order.save(err=>{
						if (err) {
							return next(new Error(`Error saving order, after create payment. ${err.message}`));
						}
						else {
							res.json({ success: true });
						}
					})
				});
				break;
			default:
				return next(new Error('No payment method selected.'));
		}
		// Not need save for ppp-credit, createPayment alredy do that. 
		// Not need save for paypal, closeOrder alredy do that. 
		if (order.payment.method == 'transfer' || order.payment.method == 'money' || order.payment.method == 'card-machine') {
			order.save(err=>{
				if (err) {
					res.json({err});
					return next(err);
				}
				else {
					res.json({ success: true });
				}
			})
		}

	});
});

// Order summary. 
router.get('/review/order/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		// Mongo error.
		if (err) { return next(err); }
		// No order.
		if (!order) { return next(new Error('No order to confirm.')); }
        // Order already placed.
        if (order.timestamps.placedAt) { return res.redirect('/user/orders'); }
		// Payment process completed.
		if (order.payment.method == 'money' || order.payment.method == 'transfer' || order.payment.method == 'card-machine' || order.payment.method == 'ppp-credit') {
			return res.render('checkout/review',
				{
					order: order,
					nav: {
					}
				}
			);
		}
		return next(new Error('Incomplet payment process, no payment method defined.')); 
	});
});

// Close order.
router.post('/close/order/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			log.error(`Closing order. Order ${req.params.order_id} do not exist to continue with payment.`);
			return res.json({ success: false, message: "Pedido não existe."});
		}
        // Order already placed.
        if (order.timestamps.placedAt) { return res.json({ success: false, message: "Pedido já foi finalizado anteriormente."}); }
		// Payment method.
		switch(order.payment.method) {
			case 'money':
			case 'card-machine':
			case 'transfer':
				order.timestamps.placedAt = new Date();
				order.status = 'placed';
				closeOrder(order, req, res);
				break;
			case 'paypal':
				// Norhting to do, alredy did at /payment/order/:order post.
				break;
			case 'ppp-credit':
				if (!order.payment.pppApprovalPayment) {
					log.error("Order not have payment approved by payap plus.");
					return res.json({ success: false, msg: "", err: "Order not have payment approved by payap plus."});
				}
				// log.silly(`req.body.paypalMockCode: ${req.body.paypalMockCode}`);
                // log.info(`Executing payPal payment... Order: ${order._id}`);
				executePayment(order, req.body.paypalMockCode, (err, pppExecutePayment)=>{
					if (err) {
						// Execute payment error.
						if (err.response && err.response.status == 400) {
							log.error(`Execute payment returned error 400: ${JSON.stringify(err, null, 2)}`);
							switch(err.response.data.name.trim()) {
								case "INTERNAL_SERVICE_ERROR":
									return res.json({ success: false, message: "Ocorreu um erro interno, por favor tente mais tarde." });
									break;
								case "INSTRUMENT_DECLINED":
									return res.json({ success: false, message: "Declínio do banco, pagamento não aprovado." });
									break;
								case "PAYMENT_NOT_APPROVED_FOR_EXECUTION":
								case "CREDIT_CARD_REFUSED":
								case "TRANSACTION_REFUSED_BY_PAYPAL_RISK":
								case "PAYER_CANNOT_PAY":
								case "PAYER_ACCOUNT_RESTRICTED":
								case "PAYER_ACCOUNT_LOCKED_OR_CLOSED":
								case "PAYEE_ACCOUNT_RESTRICTED":
								case "TRANSACTION_REFUSED":
									return res.json({ success: false, message: "Declínio do PayPal, pagamento não aprovado." });
									break;
								default:
									log.error(`Execute Payment error 400, No client message defined for error data name: ${err.response.data.name.trim()}`);
									return res.json({ success: false, message: "Ocorreu um erro inesperado, por favor tente mais tarde." });
							}
						} 
						log.error(`Executing payment. ${err.message}`);
						return res.json({ success: false, message: "Ocorreu um erro inesperado, por favor tente mais tarde.", err: err.message });
					}
					order.payment.pppExecutePayment = pppExecutePayment;
					order.timestamps.placedAt = new Date();
					order.status = 'placed';
					// Credit card pyament completed. If not the PayPal Plus system is Reviewing credit card payment.
					if (order.payment.pppExecutePayment.transactions[0].related_resources[0].sale.state === "completed") {
						order.timestamps.paidAt = order.timestamps.placedAt; 
						order.status = 'paid';
					} 
					closeOrder(order, req, res);
					// saleId: order.pppExecutePayment.transactions[0].related_resources[0].sale.id,
					// state: order.pppExecutePayment.transactions[0].related_resources[0].sale.state 
				});
				break;
			default:
				return next(new Error('No payment method selected.'));
		}
	});
});

// Close order and render confirmation.
function closeOrder(order, req, res) {
	// log.debug(`Test pppExecutePayment: ${JSON.stringify(order.payment.pppExecutePayment, null, 2)}`);
	order.save(err=>{
		if (err) {
			log.error("Closing order. Error saving order on db.");
			return res.json({ success: false, msg: "", err: err });
		}
		else {
			// Update stock.
			for (var i = 0; i < req.cart.products.length; i++) {
				// Product.updateOne({ _id: req.cart.products[i]._id }, { $inc: { storeProductQtd: -1 * req.cart.products[i].qtd } }, err=>{
                // Not update aldo products, because the actual stock is undetermined.
                // Not update allnations products, receive stock from allnations service.
                if (req.cart.products[i].dealerName !== "Aldo" && req.cart.products[i].dealerName !== "Allnations") {
                    Product.updateOne(
                        { _id: req.cart.products[i]._id },
                        { $inc: {
                            storeProductQtd: -1 * req.cart.products[i].qtd,
                            storeProductQtdSold: 1 * req.cart.products[i].qtd
                        } }, err=>{
                            if (err) {
                                log.error(err.stack);
                            }
                        });
                }
			}
            // Make product booking.
            for (const item of order.items) {
                if (item.dealerName == 'Allnations') {
                    allnations.makeBooking(item);
                    // If order already paid confirm booking after a while.
                    if (order.status == 'paid') {
                        setTimeout(()=>{
                            allnations.confirmBooking(item);
                        }, 60000);
                    }
                }
            }
			// Clean cart.
			req.cart.clean();
			// Send email.
			let mailOptions = {
				from: '',
				to: req.user.email,
				subject: 'Confirmação de pedido.'
			};
			switch(order.payment.method) {
				case 'money':
				case 'card-machine':
					mailOptions.text = 'Parabéns! Seu pedido foi realizado, agora é só aguardar o envio do produto.\n\n' +
						'O pagamento será realizado no momento do recebimento do produto.\n\n' +
						'Número de pedido: ' + order._id + '\n\n' +
						'Para acessor as informações do pedido acesse utilize o link abaixo.\n\n' +
						'https://' + req.app.get('hostname')+ '/checkout/confirmation/order/' + order._id + '\n\n' +
						'Muito obrigado por comprar na ZUNKA.'
					break;
				case 'transfer':
					mailOptions.text = 'Parabéns! Seu pedido foi realizado, agora é só efetuar a transferência.\n\n' +
						'Dados bancários\n' +
						'   Titular: ZUNKA COM E SERV EM INF EIRELI\n' +
						'   CNPJ: 15.178.404/0001-47\n' +
						'   Banco: Santander (033)\n' +
						'   Agencia: 0944\n' +
						'   Conta: 13001412-1\n' +
						'   Valor a ser depositado: R$ ' + order.totalPrice.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") + '\n\n' +
						'Número de pedido: ' + order._id + '\n\n' +
						'Para acessor as informações do pedido acesse utilize o link abaixo.\n\n' +
						'https://' + req.app.get('hostname')+ '/checkout/confirmation/order/' + order._id + '\n\n' +
						'Muito obrigado por seu pedido.'
					break;
				default:
					mailOptions.text = 'Parabéns! Sua compra já foi concluída, agora é só aguardar o envio do produto.\n\n' +
						'Número de pedido: ' + order._id + '\n\n' +
						'Para acessor as informações do pedido acesse utilize o link abaixo.\n\n' +
						'https://' + req.app.get('hostname')+ '/checkout/confirmation/order/' + order._id + '\n\n' +
						'Muito obrigado por comprar na ZUNKA.'
					break;
			}
			// Email confirmation to client.
			emailSender.sendMail(mailOptions, err=>{
				if (err) {
					log.error(err.stack);
				} else {
					// log.info(`Email with order confirmation sent to ${req.user.email}`);
				}
				res.json({ success: true });
				// Listed itens string.
				let strItens = "";
				for (let index = 0; index < order.items.length; index++) {
					strItens = strItens + order.items[index].name + '\t\tR$' + converToBRCurrencyString(order.items[index].price) + '\t\t' + order.items[index].quantity + ' unidade(s)\n';
				}
				// Tipo de pagamento.
				let strPaymentMethod;
				switch (order.payment.method) {
					case "transfer":
						strPaymentMethod = "Transferência bancária";
						break;
					case "money":
						strPaymentMethod = "Dinheiro";
						break;
					case "card-machine":
						strPaymentMethod = "Cartão presencial";
						break;
					case "paypal":
						strPaymentMethod = "Paypal";
						break;
					case "ppp-credit":
						strPaymentMethod = "Cartão de crédito";
						break;
					default:
						break;
				}
                let shippingDesc = `${order.shipping.carrier}`
                if (order.shipping.carrier === 'Correios') {
                    shippingDesc += ` (${order.shipping.methodDesc} - ${order.shipping.methodCode})`
                }
                // Not show deadline and price shipping if carrier not defined (agreement shipment)..
                let shippingDeadlineAndPrice = "";
                if (order.shipping.carrier !== "") {
                    shippingDeadlineAndPrice = '\nPrazo: ' + order.shipping.deadline + 'dia(s)\n' +  
					'Valor: R$ ' + converToBRCurrencyString(order.shipping.price);
                }
                let cpfCnpjStateRegistration; 
                let name;
                // CPF.
                if (order.cpf) {
                    name = 'Nome: ' + order.name + '\n';
					cpfCnpjStateRegistration = 'CPF: ' + order.cpf + '\n';
                }
                // CNPJ.
                else {
                    name = 'Razão social: ' + order.name + '\n' +
                    'Contato: ' + order.contactName + '\n';
					cpfCnpjStateRegistration = 'CNPJ: ' + order.cnpj + '\n' + 
					'Inscrição estaudal: ' + order.stateRegistration + '\n';
                }
				// Email to store admin.
				let toAdminMailOptions = {
					from: '',
					to: emailSender.adminEmail,
					subject: 'Novo pedido no site Zunka.com.br.',
					text: 'Número de pedido: ' + order._id + '\n\n' +

					'Cliente\n' +
					name +
					'Email: ' + order.email + '\n' +
                    cpfCnpjStateRegistration + 
					'Celular: ' + order.mobileNumber + '\n\n' +

					'Endereço\n' +
					'Nome: ' + order.shipping.address.name + '\n' +  
					'Telefone: ' + order.shipping.address.phone + '\n' +  
					'Endereço: ' + order.shipping.address.address + '\n' +  
					'Número: ' + order.shipping.address.addressNumber + '\n' +  
					'Complemento: ' + order.shipping.address.addressComplement + '\n' +  
					'Bairro: ' + order.shipping.address.district + '\n' +  
					'Cidade: ' + order.shipping.address.city + '\n' +  
					'Estado: ' + order.shipping.address.state + '\n' +  
					'CEP: ' + order.shipping.address.cep + '\n\n' +  

					'Pagamento\n' + 
					strPaymentMethod + '\n\n' +  

					'Envio\n' + 
                    shippingDesc + '\n\n' +

					'Ítens\n' +
					strItens + '\n' +

					'Valor total com frete\n' + 
					'R$ ' + converToBRCurrencyString(order.totalPrice) + '\n\n' +  

					'https://' + req.app.get('hostname')+ '/admin/orders' + '\n\n'
				};
				emailSender.sendMail(toAdminMailOptions, err=>{
					if (err) {
						log.error(err.stack);
					} else {
						// log.info(`Email with alert of new order sent to ${emailSender.adminEmail}`);
					}
				})
			})
		}
	})
}

// Order confirmation.
router.get('/confirmation/order/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			return next(new Error('No order to confirm.')); }
		else {
			res.render('checkout/confirmation',
				{
					order: order,
					nav: {
					}
				}
			);
		}
	});
});

// Estimate freight.
router.get('/estimate-freight', (req, res, next)=>{
	// Get product information.
	Product.findById(req.query.productId)
        .then(product=>{
            if (!product) {  return next(new Error('Product not found.')); }
            let pack = {
                cepDestiny: req.query.cepDestiny.replace(/\D/g, ''),
                dealer: product.dealer,
                length: product.storeProductLength,
                height: product.storeProductHeight,
                width: product.storeProductWidth,
                weight: product.storeProductWeight,
                price: product.storeProductPrice,
            }
            // Get shipping values.
            axios.get(`${s.freightServer.host}/freights/zunka`, {
                headers: {
                    "Accept": "application/json", 
                },
                auth: { 
                    username: s.freightServer.user, 
                    password: s.freightServer.password
                },
                data: pack
            })
            .then(response => {
                if (response.data.err) {
                    log.error(`Estimating freight for pack ${JSON.stringify(pack, null, 2)}. ${response.data.err}`);
                    return res.json({ err: response.data.err });
                } else {
                    // log.debug(`response.data: ${JSON.stringify(response.data, null, 2)}`);
                    res.json({ freights: response.data });
                }
            })
            .catch(err => {
                log.error(`Estimating freight for pack ${JSON.stringify(pack, null, 2)}}. ${err.stack}`);
                return res.json({ err: err });
            }); 
        })
        .catch(err=>{
            log.error(`Estimating freight. ${err.stack}`);
            return res.json({ err: err });
        });
});

/******************************************************************************
/ TEST
 ******************************************************************************/

// Only for test.
router.post('/update-stock', (req, res, next)=>{
	// Update stock.
	log.debug('Inside update-stock');
	for (var i = 0; i < req.cart.products.length; i++) {
		log.debug(`req.cart.products.length: ${req.cart.products.length}`);
		log.debug(`req.cart.products[i]._id: ${req.cart.products[i]._id}`);
		log.debug(`req.cart.products[i].qtd: ${req.cart.products[i].qtd}`);
		Product.updateOne({ _id: req.cart.products[i]._id }, { $inc: { storeProductQtd: -1 * req.cart.products[i].qtd } }, err=>{
			log.error(`err: ${err}`);
		});
	};
	// Clean cart.
	req.cart.clean();
	res.json({ success: true , cart: req.cart });
});


/******************************************************************************
/ Paypal
 ******************************************************************************/

// Sandbox configurations.
let ppUrl = ppConfig.sandbox.ppUrl;
let ppIpnUrl = ppConfig.sandbox.ppIpnUrl;
let ppClientId = ppConfig.sandbox.ppClientId;
let ppSecret = ppConfig.sandbox.ppSecret;
// Production configurations.
if (process.env.NODE_ENV == 'production') {
	ppUrl = ppConfig.production.ppUrl;
	ppIpnUrl = ppConfig.production.ppIpnUrl;
	ppClientId = ppConfig.production.ppClientId;
	ppSecret = ppConfig.production.ppSecret;
}
// Redis keys.
let redisPaypalAccessTokenKey = "paypalAccessToken"

// PayPal Plus create payment.
function createPayment(order, cb){
	// Items.
	let items = [];
	for (var i = 0; i < order.items.length; i++) {
		let item = {
			name: order.items[i].name,
			// item.description: '',
			quantity: order.items[i].quantity,
			price: order.items[i].price,
			//- tax: "0.01",
			sku: order.items[i]._id,
			currency: "BRL"
		};
		items.push(item);
	}
	// Shipping address.
	let shippingAddress = {
		recipient_name: order.shipping.address.name,
		line1: `${order.shipping.address.address}, ${order.shipping.address.addressNumber} - ${order.shipping.address.district}`,
		line2: order.shipping.address.complement,
		city: order.shipping.address.city,
		country_code: 'BR',
		postal_code: order.shipping.address.cep,
		phone: order.shipping.address.phone,
		state: order.shipping.address.state
	};

	let payReqData = {
		transactions: [{
			amount: {
				currency: "BRL",
				total: order.totalPrice,
				details: {
					subtotal: order.subtotalPrice,
					shipping: order.shipping.price,
				}
			},
			// payee: {
				// email: emailSender.adminEmail
			// },
			description: "Itens to carrinho.",
			payment_options: {
				allowed_payment_method: "IMMEDIATE_PAY"
			},
			// invoice_number: "942342",
			item_list: {
				items: items,
				shipping_address: shippingAddress
			}
		}],
		redirect_urls: {
			return_url: "https://www.zunka.com.br/checkout/ppp/return/null",
			cancel_url: "https://www.zunka.com.br/checkout/ppp/cancel/null"
		}
	};

	// Get access token.
	getAccessToken((err, ppAccessTokenData)=>{
		if (err) {
			return cb (err);
		} 	
		payReqData.intent = "sale";
		payReqData.payer = { payment_method: "paypal" };
		payReqData.application_context = {
			brand_name: "Zunka",
			shipping_preference: "SET_PROVIDED_ADDRESS"
		}, 
        // log.silly(`payReqData: ${JSON.stringify(payReqData, null, 2)}`);
        log.debug(`payReqData: ${JSON.stringify(payReqData, null, 2)}`);
		// Create a payment request.
		axios({
			method: 'post',
			url: `${ppUrl}payments/payment/`,
			headers: {
				"Accept": "application/json", 
				"Accept-Language": "en_US",
				"Content-Type": "application/json",
				"Authorization": ppAccessTokenData.token_type + " " + ppAccessTokenData.access_token
			},
			data: payReqData
		}).then(response => {
			if (response.data.err) {
				return cb(new Error(`Creating payment request on paypal web service. ${response.data.err}`));
			} else {
				// log.silly(`Created a payment request on payapl web service: ${JSON.stringify(response.data, null, 2)}`);
				// log.info(`PayPal payment request created. Order: ${order._id}`);
				order.payment.pppCreatePayment = response.data;
				// return cb(null, response.data);
				return cb(null);
			}
		}).catch(err => {
			cb(new Error(`Creating payment request on paypal web server. ${err.message}`));
		}); 
	});
};

// PayPal Plus approval payment (payment using credit card) - page.
router.get('/ppp/payment/approval/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) { return next(new Error('No order to continue with approval payment.')); }
        // Order already placed.
        else if (order.timestamps.placedAt) { return res.redirect('/user/orders'); }
		else {
			res.render('checkout/pppApproval',
				{
					order: order,
					nav: {
					},
					env: (process.env.NODE_ENV === 'production' ? 'live': 'sandbox')
				}
			);
		}
	});
});

// Paypal Plus approval payment (payment using credit card).
// Save ppp approval payment result.
router.post('/ppp/payment/approval/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) { return next(new Error('No order to continue with approval payment.')); }
        // Order already placed.
        if (order.timestamps.placedAt) { return next(new Error('Order already closed.')); }
		else {
			// log.debug(`Paypal approval return: ${JSON.stringify(req.body.pppApprovalPayment, null, 2)}`);
			order.payment.pppApprovalPayment = req.body.pppApprovalPayment;
			order.save(err=>{
				if (err) {
					return next(new Error(`Saving pppApprovalPayment. ${err.message}`));
				}
				res.json({ success: true });
			});
		}
	});
});

// Check if payment is complete.
router.get('/ppp/payment/complete/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) {
			log.error(new Error(`Checking payment complete. ${err.message}'`)); 
			return res.json({success: false});
		}
		if (!order) {
			log.error(new Error(`Checking payment complete. No order to continue.`)); 
			return res.json({success: false});
		}
		if (order.status === "paid") {
			return res.json({success: true, completed: true});
		}
		getPayment(order, (err, payment)=> {
			if (err) {
				log.error(new Error(`Checking payment complete. ${err.message}`)); 
				return res.json({success: false});
			}
			if (payment.transactions[0].related_resources[0].sale.state != "completed") {
				return res.json({success: true, completed: false});
			}
			// update order.
            // Paypal.
            if (order.payment.method == "paypal") {
			    order.payment.paypal.transactions[0].related_resources[0].sale.state = "completed";
            } 
            // Credit card.
            else {
			    order.payment.pppExecutePayment.transactions[0].related_resources[0].sale.state = "completed";
            }
			order.timestamps.paidAt = new Date();
			order.status = 'paid';
			order.save(err=>{
				if (err) {
					log.error(new Error(`Checking payment complete. Saveing order. ${err.message}`));
					return res.json({success: false});
				} else {
					return res.json({success: true, completed: true});
				}
			});
		});
	});
});

// Get access token.
// If not in db or in db but expired, take from paypal server.
function getAccessToken(cb){
	redis.get(redisPaypalAccessTokenKey, (err, ppAccessTokenData)=>{
		// Redis error.
		if (err) {
			return cb(new error(`Retriving paypal access token from redis db. ${err.message}`));
		}
		// Already have access token on redis db.
		if (ppAccessTokenData) {
			ppAccessTokenData = JSON.parse(ppAccessTokenData);
			let now = new Date();
			let expiresDate = new Date(ppAccessTokenData.expires_date);
			// Not expired yet.
			if (expiresDate > now) {
				return cb(null, ppAccessTokenData);
			}
		}
		// Not access token on redis db or it expired.
		// Get access token from paypal.
		let reqTime = new Date();
		axios({
			method: 'post',
			url: ppUrl + "oauth2/token",
			headers: {
				"Accept": "application/json", 
				// "PayPal-Partner-Attribution-Id: <Your-BN-Code>", 
				"Accept-Language": "en_US",
				"content-type": "application/x-www-form-urlencoded"
			},
			auth: { 
				username: ppClientId, 
				password: ppSecret 
			},
			params: { grant_type: "client_credentials" }
		}).then(response => {
			if (response.data.err) {
				return cb(new error(`Retriving paypal access token from paypal web server. ${response.data.err}`));
			} else {
				response.data.get_date = reqTime;
				response.data.expires_date = new Date(response.data.expires_in * 1000 + reqTime.getTime());
				// log.silly(`A new paypal access token was retrived from paypal web server.`);
				// log.debug(`${JSON.stringify(response.data, null, 2)}`);
				redis.set(redisPaypalAccessTokenKey, JSON.stringify(response.data), (err)=>{
					if (err) {
						return cb(new error(`Saving paypal access token o redis db, ${err.message}`));
					}
					else {
						return cb(null, response.data);
					}
				});
			}
		}).catch(err => {
			cb(new Error(`Retriving paypal access token. ${err.message}`));
		}); 
	});
}

// Execute payment.
function executePayment(order, paypalMockCode, cb){
	// Get access token.
	getAccessToken((err, ppAccessTokenData)=>{
		if (err) {
			return cb (err);
		} 	
		// Url for execute payment.
		let urlExecute = "";
		order.payment.pppCreatePayment.links.forEach(item=>{
			if (item.rel == "execute") {
				urlExecute = item.href;
				return;
			}
		});
		// log.debug(`urlExecute: ${urlExecute}`);
		if (!urlExecute) {
			return cb(new Error(`Executing payment, no url execute payment found.`));
		}
		// Payer id.
		let payerId = order.payment.pppApprovalPayment.result.payer.payer_info.payer_id;
		// log.debug(`payerId: ${payerId}"`);
		let headers = {
			"Accept": "application/json", 
			"Accept-Language": "en_US",
			"Content-Type": "application/json",
			"Authorization": ppAccessTokenData.token_type + " " + ppAccessTokenData.access_token
		};
		// Only for test, negative test.
		if (paypalMockCode) {
			headers["PayPal-Mock-Response"] = `{\"mock_application_codes\":\"${paypalMockCode.trim()}\"}`;
		}
		// log.debug(`payapl execute header: ${JSON.stringify(headers, null, 3)}`);
		// Execute payment.
		axios({
			method: 'post',
			url: urlExecute,
			headers: headers,
			data: { payer_id: payerId}
		}).then(response => {
			if (response.data.err) {
				return cb(new Error(`Executing payment on paypal web service. ${response.data.err}`));
			} else {
				// log.silly(`Pyapal execute payment: ${JSON.stringify(response.data, null, 2)}`);
				// log.info(`PayPal payment executed. Order: ${order._id}`);
				return cb(null, response.data);
			}
		}).catch(err => {
			return cb(err);
		}); 
	});
}

// Get payment.
function getPayment(order, cb){
	// Get access token.
	getAccessToken((err, ppAccessTokenData)=>{
		if (err) {
			return cb(new Error(`Getting payment info from paypal web service. ${err}`));
		} 	
		// Payer id.
        let paymentId = "";
        // Paypal.
        if (order.payment.method == "paypal"){
            paymentId = order.payment.paypal.id;
        } 
        // Credit card.
        else {
            paymentId = order.payment.pppExecutePayment.id;
        }

        // log.debug(`url: ${ppUrl}payments/payment/${paymentId}`);
		axios.get(`${ppUrl}payments/payment/${paymentId}`, {
			headers: {
				"Accept": "application/json", 
				"Accept-Language": "en_US",
				// "Content-Type": "application/json",
				"Authorization": ppAccessTokenData.token_type + " " + ppAccessTokenData.access_token
			}
		})
		.then(response => {
			if (response.data.err) {
				return cb(new Error(`Getting payment info from paypal web service. ${response.data.err}`));
			} else {
                // log.debug(`Payment info: ${JSON.stringify(response.data, null, 2)}`);
				return cb(null, response.data);
			}
		})
		.catch(err => {
			log.error(err.stack);
			return cb(new Error(`Getting payment info from paypal web service. ${err}`));
		}); 
	});
}

module.exports.getPayment = getPayment;
module.exports.checkCpfCnpjMobileRegistred = checkCpfCnpjMobileRegistred;