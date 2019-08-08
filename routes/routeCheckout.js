'use strict';
const express = require('express');
const router = express.Router();
const passport = require('passport');
const emailSender = require('../config/email');
const soap = require('soap');
// const https = require('https');
// const request = require('request');
const axios = require('axios');

// Personal modules.
const log = require('../config/log');
const User = require('../model/user');
const Address = require('../model/address');
const Order = require('../model/order');
const Product = require('../model/product');
const ppConfig = require('../config/s').paypal;

// Redis.
const redis = require('../db/redis');

// CEP origin, Rua Bicas - 31030160.
const CEP_ORIGIN = '31030160';
const STANDARD_DELIVERY_DEADLINE = 10;
const STANDARD_DELIVERY_PRICE = '60.00';

module.exports = router;

// Format number to money format.
function formatMoney(val){
	return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
		req.checkBody('newAddress.name', 'Campo deve ser preenchido.').notEmpty();
		req.checkBody('newAddress.cep', 'Campo deve ser preenchido.').notEmpty();
		req.checkBody('newAddress.address', 'Campo deve ser preenchido.').notEmpty();
		req.checkBody('newAddress.addressNumber', 'Campo deve ser preenchido.').notEmpty();
		req.checkBody('newAddress.district', 'Campo deve ser preenchido.').notEmpty();
		req.checkBody('newAddress.city', 'Campo deve ser preenchido.').notEmpty();
		req.checkBody('newAddress.state', 'Campo deve ser preenchido.').notEmpty();
		req.checkBody('newAddress.phone', 'Campo deve ser preenchido.').notEmpty();
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
router.get('/shipping-method/:order_id', (req, res, next)=>{
	// Find order not placed yet.
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			return next(new Error('No order to continue with shipping method selection.')); }
		else {
			// Calculate box size shipment approximately.
			let shippingBox = { cepOrigin: CEP_ORIGIN, cepDestiny: order.shipping.address.cep, length: 0, height: 0, width: 0, weight: 0 };
			// For each item.
			for (let i = 0; i < order.items.length; i++) {
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
				// Box shipping dimensions.
				order.shipping.box = shippingBox;
			}
			log.debug('Wating correios ws...');
			estimateAllCorreiosShipping(shippingBox, (err, result)=>{
				log.debug('Receive correios ws answer.');
				// No Correio info.
				if (err) {
					log.debug(`Correios ws error, using default delivery price and deadline. Price: ${STANDARD_DELIVERY_PRICE}, Deadline: ${STANDARD_DELIVERY_DEADLINE}`)
					order.shipping.correioResult = {};
					order.shipping.correioResults = [];
					order.shipping.price = STANDARD_DELIVERY_PRICE;
					order.shipping.deadline = STANDARD_DELIVERY_DEADLINE;
				}
				// Got correio info.
				else {
					// log.debug(`Result: ${JSON.stringify(result)}`);
					// order.shipping.correioResult = result[0]; // Deprected.
					order.shipping.correioResults = result;
				}
				// Get motoboy shipping values.
				// log.debug(JSON.stringify(order.address));
				redis.get('motoboy-delivery', (err, motoboyDeliveries)=>{
					// Internal error.
					if (err) {
						log.error(err.stack);
						return res.render('/error', { message: 'Can not find motoboy delivery data.', error: err });
					}
					motoboyDeliveries = JSON.parse(motoboyDeliveries) || [];
					// Find city.
					order.shipping.motoboyResult = {
						price: '',
						deadline: ''
					};
					let cityNormalized = order.shipping.address.city.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
					motoboyDeliveries.forEach(motoboyDelivery=>{
						// log.info('--------');
						// log.info(motoboyDelivery.cityNormalized);
						// log.info(cityNormalized);
						// log.info('--------');
						if (motoboyDelivery.city.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '') === cityNormalized) {
							order.shipping.motoboyResult.price = motoboyDelivery.price;
							order.shipping.motoboyResult.deadline = motoboyDelivery.deadline;
						}
					});
					// Uncomment to test with free shipping todo.
					// order.shipping.price = 0;
					// Save correio result.
					order.save((err, newAddress) => {
						if (err) {
							res.json({err});
							return next(err);
						} else {
							res.render('checkout/shippingMethod', {
								nav: {
								},
								order
							});
						}
					});
				});
			})
		}
	});
});

// Select shipment.
router.post('/shipping-method/:order_id', (req, res, next)=>{
	// Set shipment method to default.
	Order.findById(req.params.order_id, (err, order)=>{
		// console.log(`req.body: ${JSON.stringify(req.body)}`);
		if (req.body.shippingMethod == 'motoboy'){
			order.shipping.carrier = 'Sérgio Delivery';
			order.shipping.methodCode = '00001';
			order.shipping.methodDesc = 'Motoboy';
			// Motoboy result using ',' as decimal point.
			order.shipping.price = order.shipping.motoboyResult.price.replace('.', '').replace(',', '.');
			order.shipping.deadline = order.shipping.motoboyResult.deadline;
		} 
		// Correios delivery type.
		else {
			for (let index = 0; index < order.shipping.correioResults.length; index++) {
				if (order.shipping.correioResults[index].Codigo == req.body.shippingMethod) {
					order.shipping.carrier = 'Correios';
					order.shipping.methodCode = order.shipping.correioResults[index].Codigo;
					order.shipping.methodDesc = order.shipping.correioResults[index].DescServico;
					// Shipping price. Correio using ',' as decimal point.
					order.shipping.price = order.shipping.correioResults[index].Valor.replace('.', '').replace(',', '.');
					// Shipping deadline.
					order.shipping.deadline = parseInt(order.shipping.correioResults[index].PrazoEntrega);
				}
			}
		}
		order.totalPrice = (parseFloat(order.subtotalPrice) + parseFloat(order.shipping.price)).toFixed(2);
		order.timestamps.shippingMethodSelectedAt = new Date();
		order.status = 'shippingMethodSelected';
		order.save(err=>{
			if (err) { return next(err) };
			res.json({});
		});
	});
});

// Payment - page.
router.get('/payment/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			return next(new Error('No order to continue with payment.')); }
		// Must have cpf and mobile number.
		if (!order.cpf || !order.mobileNumber ) {
			res.render('checkout/needCpfAndMobileNumber',
				{
					cpf: req.user.cpf,
					mobileNumber: req.user.mobileNumber,
					orderId: req.params.order_id,
					nav: {
					},
				}
			);
		}
		else {
			res.render('checkout/payment',
				{
					order: order,
					nav: {
					},
					env: (process.env.NODE_ENV === 'production' ? 'production': 'sandbox')
				}
			);
		}
	});
});

// Need cpf and mobile number.
router.post('/needCpfAndMobileNumber', checkPermission, (req, res, next)=>{
	// Validation.
	// Only digits.
	let mobileNumberTemp = req.body.mobileNumber.match(/\d+/g);
	if (mobileNumberTemp != null) {
		req.body.mobileNumber = mobileNumberTemp.join('');
	}
	req.sanitize("cpf").trim();
	req.checkBody('mobileNumber', 'Campo NÚMERO DE CELULAR ínválido.').isLength({ min: 10});
	req.checkBody('mobileNumber', 'Campo NÚMERO DE CELULAR inválido.').isLength({ max: 11});
	req.checkBody('cpf', 'Campo CPF deve ser preenchido.').notEmpty();
	req.checkBody('cpf', 'CPF inválido.').isCpf();
	req.getValidationResult().then(function(result) {
		// Send validations errors to client.
		if (!result.isEmpty()) {
			let messages = [];
			messages.push(result.array()[0].msg);
			return res.json({ success: false, message: messages[0]});
		}
		// Save cpf.
		else {
			// Format CPF.
			// Get only the digits.
			let cpf = req.body.cpf.match(/\d+/g).join('');
			// Array [3][3][3][2].
			cpf = cpf.match(/\d{2}\d?/g);
			// Format to 000.000.000-00.
			cpf = `${cpf[0]}.${cpf[1]}.${cpf[2]}-${cpf[3]}`
			// Format mobile number.
			// Get only the digits.
			let mobileNumber = req.body.mobileNumber.match(/\d+/g).join('');
			// Array [2][1][1+][4].
			mobileNumber = mobileNumber.match(/(^\d{2})(\d)(\d+)(\d{4})$/);
			// Format to 000.000.000-00.
			mobileNumber = `(${mobileNumber[1]}) ${mobileNumber[2]} ${mobileNumber[3]}-${mobileNumber[4]}`;
			// Save user data.
			User.findById(req.user._id, (err, user)=>{
				if (err) { return next(err) };
				if (!user) { return next(new Error('Not found user to save.')); }
				user.cpf = cpf;
				user.mobileNumber = mobileNumber;
				user.save(function(err) {
					if (err) { return next(err); }
					// Save order data.
					Order.findById(req.body.orderId, (err, order)=>{
						if (err) { return next(err) };
						if (!order) { return next(new Error('Not found order to save cpf and mobile number.')); }
						order.cpf = cpf;
						order.mobileNumber = mobileNumber;
						order.save(function(err) {
							if (err) { return next(err); }
							return res.json({ success: true});
						});
					});
				});
			});
		}
	});
});

// Payment.
router.post('/payment/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			return next(new Error('No order to continue with payment.')); }
		else {
			order.timestamps.placedAt = new Date();
			order.status = 'placed';
			if (req.query.method === 'paypal') {
				order.timestamps.paidAt = new Date();
				order.status = 'paid';
				order.payment = {
					paypal: req.body.payment,
					method: 'paypal'
				};
			}
			else if (req.query.method === 'money'){
				order.payment = {
					method: 'money'
				};
			}
			else if (req.query.method === 'transfer'){
				order.payment = {
					method: 'transfer'
				};
			}
			else {
				return next(new Error('No payment method selected.'));
			}
			order.save(err=>{
				if (err) {
					res.json({err});
					return next(err);
				}
				else {
					// Update stock.
					for (var i = 0; i < req.cart.products.length; i++) {
						// Product.updateOne({ _id: req.cart.products[i]._id }, { $inc: { storeProductQtd: -1 * req.cart.products[i].qtd } }, err=>{
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
					// Clean cart.
					req.cart.clean();
					// Send email.
					let mailOptions = {
						from: '',
						to: req.user.email,
						subject: 'Confirmação de pedido.'
					};
					if (req.query.method === 'paypal'){
						mailOptions.text = 'Parabéns! Sua compra já foi concluída, agora é só aguardar o envio do produto.\n\n' +
							'Número de pedido: ' + order._id + '\n\n' +
							'Para acessor as informações do pedido acesse utilize o link abaixo.\n\n' +
							'https://' + req.app.get('hostname')+ '/checkout/order-confirmation/' + order._id + '\n\n' +
							'Muito obrigado por comprar na ZUNKA.'
					}
					if (req.query.method === 'money'){
						mailOptions.text = 'Parabéns! Seu pedido foi realizado, agora é só aguardar o envio do produto.\n\n' +
							'O pagamento será realizado no momento do recebimento do produto.\n\n' +
							'Número de pedido: ' + order._id + '\n\n' +
							'Para acessor as informações do pedido acesse utilize o link abaixo.\n\n' +
							'https://' + req.app.get('hostname')+ '/checkout/order-confirmation/' + order._id + '\n\n' +
							'Muito obrigado por comprar na ZUNKA.'
					}
					else if (req.query.method === 'transfer'){
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
							'https://' + req.app.get('hostname')+ '/checkout/order-confirmation/' + order._id + '\n\n' +
							'Muito obrigado por seu pedido.'
					}
					// Email confirmation to client.
					emailSender.sendMail(mailOptions, err=>{
						if (err) {
							log.error(err.stack);
						} else {
							log.info(`Email with order confirmation sent to ${req.user.email}`);
						}
						res.json({});
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
							case "paypal":
								strPaymentMethod = "Paypal";
								break;
							default:
								break;
						}
						let strShippingMethod;
						switch (order.shipping.method) {
							case "correios":
								strShippingMethod = "Correios";
								break;
							case "motoboy":
								strShippingMethod = "Motoboy";
								break;
							default:
								break;
						}
						// Email to store admin.
						let toAdminMailOptions = {
							from: '',
							to: emailSender.adminEmail,
							subject: 'Novo pedido no site Zunka.com.br.',
							text: 'Número de pedido: ' + order._id + '\n\n' +

							'Cliente\n' +
							'Nome: ' + order.name + '\n' +
							'Email: ' + order.email + '\n' +
							'CPF: ' + order.cpf + '\n' +
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
							'Método: ' + strPaymentMethod + '\n\n' +  

							'Envio\n' + 
							'Método: ' + strShippingMethod + '\n' +  
							'Prazo: ' + order.shipping.deadline + 'dia(s)\n' +  
							'Valor: R$ ' + converToBRCurrencyString(order.shipping.price) + '\n\n' +  

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
								log.info(`Email with alert of new order sent to ${emailSender.adminEmail}`);
							}
						})
					})
				}
			})
		}
	});
});

// Order confirmation - page.
router.get('/order-confirmation/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			return next(new Error('No order to confirm.')); }
		else {
			res.render('checkout/orderConfirmation',
				{
					order: order,
					nav: {
					}
				}
			);
		}
	});
});

// Estimate shipment.
router.get('/ship-estimate', (req, res, next)=>{
	let deliveryData = [];
	// console.log('req.query', req.query);
	// Get product information.
	Product.findById(req.query.productId, (err, product)=>{
		if (err) { return next(err); }
		if (!product) {  return next(new Error('Product not found.')); }
		let box = {
			cepOrigin: CEP_ORIGIN,
			cepDestiny: req.query.cepDestiny.replace(/\D/g, ''),
			length: product.storeProductLength,
			height: product.storeProductHeight,
			width: product.storeProductWidth,
			weight: product.storeProductWeight
		}

		// Correio shipping estimate.
		const promiseCorreiosShipping = new Promise((resolve, reject)=>{
			// console.log(`box: ${JSON.stringify(box)}`);
			estimateAllCorreiosShipping(box, (err, result)=>{
				if (err) { 
					return reject(err); 
				}
				var deliveryData = []
				for (let index = 0; index < result.length; index++) {
					deliveryData.push({
						method: result[index].DescServico,
						price: result[index].Valor,
						deadline: result[index].PrazoEntrega
					});
				}
				// log.debug(`promiseCorreiosShipping result: ${JSON.stringify(deliveryData)}`);
				resolve(deliveryData);
				// reject("asdf");
			});
		});
		// Motoboy shipping estimate.
		const promiseMotoboyShipping = new Promise((resolve, reject)=>{
			getMotoboyDeliveryFromCEP(box.cepDestiny, (err, result)=>{
				// if (err) { reject(err); }
				if (err) { 
					return reject(err); 
				}
				// log.debug(`promiseMotoboyShipping result: ${JSON.stringify(result)}`);
				resolve(result);
				// reject("asdf");
			});
		});
		// When receive all return.
		Promise.all([
			promiseCorreiosShipping.catch(err=>{log.error(err.stack)}), 
			promiseMotoboyShipping.catch(err=>{log.error(err.stack)})
		]).then(([deliveryCorreio, deliveryMotoboy])=>{
			// log.debug("Promisse.all");
			// log.debug(`deliveryCorreio: ${JSON.stringify(deliveryCorreio)}`);
			// log.debug(`deliveryMotoboy: ${JSON.stringify(deliveryMotoboy)}`);
			if(deliveryMotoboy) {
				// deliveryCorreio.push(deliveryMotoboy);
				deliveryCorreio.unshift(deliveryMotoboy);
			}
			// log.debug(`delivery: ${JSON.stringify(deliveryCorreio)}`);
			if(deliveryCorreio) {
				res.json({ delivery: deliveryCorreio });
			} else {
				res.json({ err: "Serviço indisponível." });
			}
		});

		// // When receive all return.
		// Promise.all([promiseCorreiosShipping, promiseMotoboyShipping]).then(([deliveryCorreio, deliveryMotoboy])=>{
		//   log.debug("Promisse.all");
		//   // log.debug(`deliveryCorreio: ${JSON.stringify(deliveryCorreio)}`);
		//   // log.debug(`deliveryMotoboy: ${JSON.stringify(deliveryMotoboy)}`);
		//   if(deliveryMotoboy) {
		//     // deliveryCorreio.push(deliveryMotoboy);
		//     deliveryCorreio.unshift(deliveryMotoboy);
		//   }
		//   log.debug(`delivery: ${JSON.stringify(deliveryCorreio)}`);
		//   res.json({ delivery: deliveryCorreio });
		//   // res.json({ err: "Promisse no err." });
		// }).catch(err=>{
		//   log.error(err);
		// });

	});
});

// Get motoboy delivery from CEP.
function getMotoboyDeliveryFromCEP(cep, cb) {
	getAddressFromCEP(cep, (err, addressResult)=> {
		// If MG.
		if(err) {
			return cb(err);
		}
		if(addressResult.uf === "MG"){
			// Get motoboy shipping values.
			redis.get('motoboy-delivery', (err, motoboyDeliveries)=>{
				// Internal error.
				if (err) {
					return cb(err);
				}
				motoboyDeliveries = JSON.parse(motoboyDeliveries) || [];
				let cityNormalized = addressResult.localidade.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
				motoboyDeliveries.forEach(motoboyDelivery=>{
					if (motoboyDelivery.city.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '') === cityNormalized) {
						return cb(null, {
							method: "Motoboy",
							price: motoboyDelivery.price,
							deadline: motoboyDelivery.deadline
						});
						// return;
					}
				});
			});
		} else {
			// No motoboy delivery.
			return cb(null, null);
		}
	});
};

// Get address from CEP.
function getAddressFromCEP(val, cb) {
	// Cep is valid if 00000-000 or 00000000.
	if (val.match(/^\d{5}-?\d{3}$/)) {
		val = val.replace("-", "");
		axios({
			method: 'get',
			url: `https://viacep.com.br/ws/${val}/json/`,
		})
			.then((res)=>{
				// console.log(`res: ${JSON.stringify(res)}`);
				// log.debug(JSON.stringify(res.data));
				// Some error, no more information from ws.
				if (res.data.erro) {
					return cb(res.data.erro);
				}
				// Found CEP.
				else {
					// log.debug(JSON.stringify(res.data));
					cb(null, res.data);
				}
			})
			.catch((err)=>{
				log.error(`getAddressFromCEP(), ${err.stack}`);
				return cb(err);
			});        
	} 
	// Inválid cep format.
	else {
		return cb('Cep inválido.');
	}
}

// Estimate shipment.
// box = {lenght, height, wdith, weight}
// length, height, width in cm.
// weight in grams.
function estimateAllCorreiosShipping(box, cb) {
	// Length can not be less than 16cm (correio error);
	if (box.length < 16) { box.length = 16 };
	// Height can not be less than 2cm (correio error);
	if (box.height < 2) { box.height = 2 };
	// Width can not be less than 2cm (correio error);
	if (box.width < 11) { box.width = 11 };
	// Create soap.
	soap.createClient('http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx?wsdl', (err, client)=>{
		if (err) {
			log.error('soap.createClient(), ' + err.stack);
			return cb(err);
		}
		// Argments.
		let args = {
			nCdEmpresa: '',  // Código administrativo junto à ECT (para clientes com contrato) .
			sDsSenha: '',
			// 40045 - Error: WS Correios - Code: 40045, err: Código de serviço inválido/inativo.
			// 40290 - Error: WS Correios - Code: 40290, err: Não foi encontrada precificação. MSG-015: Para o serviço: 40290 o preço nã$ se aplica para origem: 31030160 para o destino: 91710000(-1).
			// 40010 - SEDEX Varejo
			// 40045 - SEDEX a Cobrar Varejo
			// 40215 - SEDEX 10 Varejo
			// 40290 - SEDEX Hoje Varejo
			// 41106 - PAC Varejo
			nCdServico: "41106, 40010, 40215",
			sCepOrigem: box.cepOrigin.replace(/\D/g, ''),
			sCepDestino: box.cepDestiny.replace(/\D/g, ''),
			nVlPeso: (box.weight / 1000).toString(),    // Weight in Kg.
			nCdFormato: 1,    // 1 - caixa/pacote, 2 - rolo/prisma, 3 - Envelope.
			nVlComprimento: box.length,  // Lenght in cm.
			nVlAltura: box.height,  // Height in cm.
			nVlLargura: box.width,   // Width in cm.
			nVlDiametro: 0,   // Diâmetro em cm.
			sCdMaoPropria      : 'N',   // Se a encomenda será entregue com o serviço adicional mão própria.
			nVlValorDeclarado  : 0,
			sCdAvisoRecebimento: 'N'
		};
		// log.debug('args: ' + JSON.stringify(args));
		// Uncomment for fast debud, to not use Correios webservice.
		// return cb('Serviço indisponível');
		// Call webservice.
		client.CalcPrecoPrazo(args, (err, result)=>{
			// log.debug("Correio retuned");
			if (err) {
				log.error('client.CalcPrecoPrazo, ' + err.stack);
				return cb('Serviço indisponível');
			}
			// Log and remove CSerivco with erros.
			for (let index = 0; index < result.CalcPrecoPrazoResult.Servicos.cServico.length; index++) {
				if (result.CalcPrecoPrazoResult.Servicos.cServico[index].Erro !== '0') {
					// log.error(new Error('WS Correios - Code: ' + result.CalcPrecoPrazoResult.Servicos.cServico[index].Codigo + ", err: " + result.CalcPrecoPrazoResult.Servicos.cServico[index].MsgErro).stack);
					result.CalcPrecoPrazoResult.Servicos.cServico.splice(index, 1);
					index--;
				}
				// Set method description.
				else {
					switch (result.CalcPrecoPrazoResult.Servicos.cServico[index].Codigo.toString().trim()) {
						case "41106":
							result.CalcPrecoPrazoResult.Servicos.cServico[index].DescServico = "PAC (Correios)";
							break;
						case "40215":
							result.CalcPrecoPrazoResult.Servicos.cServico[index].DescServico = "Sedex 10 (Correios)";
							break;
						case "40010":
							result.CalcPrecoPrazoResult.Servicos.cServico[index].DescServico = "Sedex (Correios)";
							break;
						default:
							result.CalcPrecoPrazoResult.Servicos.cServico[index].DescServico = "?";
							break;
					}
				}
			}
			// Error in all codes.
			if (result.CalcPrecoPrazoResult.Servicos.cServico.length == 0) {
				let errMsg = "Serviço indisponível."
				log.error(new Error(errMsg).stack);
				return cb(errMsg);
			}
			// Have at least one valid code.
			// log.debug(JSON.stringify(result.CalcPrecoPrazoResult.Servicos.cServico, " "));
			return cb(null, result.CalcPrecoPrazoResult.Servicos.cServico);
		});
	});
};

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

function converToBRCurrencyString(val) {
	return val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


/******************************************************************************
/ Paypal
 ******************************************************************************/
// Sandbox configurations.
let ppUrl = ppConfig.sandbox.ppUrl;
let ppClientId = ppConfig.sandbox.ppClientId;
let ppSecret = ppConfig.sandbox.ppSecret;
// Production configurations.
if (process.env.NODE_ENV == 'production') {
	ppUrl = ppConfig.production.ppUrl;
	ppClientId = ppConfig.production.ppClientId;
	ppSecret = ppConfig.production.ppSecret;
}
// Web profile name.
let ppWebProfileName = ppConfig.webProfileName;
// Redis keys.
let redisPaypalWebProfileKey = "paypalWebProfile"
let redisPaypalAccessTokenKey = "paypalAccessToken"

// Paypal create payment.
router.post('/paypal/create-payment/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			return next(new Error('No order to continue with payment.')); }
		else {
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
					payee: {
						email: emailSender.adminEmail
					},
					description: "Itens to carrinho.",
					item_list: {
						items: items,
						shipping_address: shippingAddress
					}
				}],
				redirect_urls: {
					return_url: "https://www.zunka.com.br/checkout/paypal/return",
					cancel_url: "https://www.zunka.com.br/checkout/paypal/cancel"
				}
			};
			// Create payment request.
			createPayment(payReqData, (err, result)=>{
				if (err) {
					log.error(err.stack);
					res.json({ success: false });
				} else {
					// Save paypal payment request result.
					order.payment = {};
					order.payment.method = "paypalRestApi";
					order.payment.paypalPaymentRequestResult = result;
					order.save((err)=>{
						if (err) {
							log.error(err.stack);
							res.json({ success: false });
						}
						else {
							res.json({ success: true });
						}
					});
				}
			});
		}
	});
});

// Paypal payment page.
router.get('/payment/paypal/:order_id', (req, res, next)=>{
	Order.findById(req.params.order_id, (err, order)=>{
		if (err) { return next(err); }
		if (!order) {
			// todo-test
			return next(new Error('No order to continue with payment.')); }
		else {
			// todo - avoid process order again.
			res.render('checkout/paypalPayment',
				{
					order: order,
					nav: {
					},
					env: (process.env.NODE_ENV === 'production' ? 'production': 'sandbox')
				}
			);
		}
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
				log.debug(`A new paypal access token was retrived from paypal web server.`);
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

// Get web profile.
function getWebProfile(ppAccessTokenData, cb) {
	// Get web profile from db.
	redis.get(redisPaypalWebProfileKey, (err, ppWebProfileRaw)=>{
		if (err) {
			return cb("Error, getting web profile on redis db: " + err.message);
		}
		else {
			// Web profile cached on db.
			if (ppWebProfileRaw) {
				let ppWebProfile = JSON.parse(ppWebProfileRaw);
				// log.debug(`ppWebProfile.name: ${ppWebProfile.name}`);
				// log.debug(`ppWebProfile: ${ppWebProfileName}`);
				// Web profile name found on db match.
				if (ppWebProfile.name === ppWebProfileName) {
					return cb(null, ppWebProfile);
				}
			}
			// No web profile on db or not match web profile name.
			// Get web profile from paypal web server.
			getWebProfileFromPaypalWebServer(ppAccessTokenData, (err, ppWebProfile)=>{
				if (err) {
					return cb(err);
				}
				// Found web profile on paypal web server.
				if (ppWebProfile) {
					// Save web profile on db.
					redis.set(redisPaypalWebProfileKey, JSON.stringify(ppWebProfile), (err)=>{
						if (err) {
							return cb("Error, saving web profile on redis db: " + err.message);
						}
						else {
							return cb(null, ppWebProfile);
						}
					});
					return;
				}
				// No web profile on paypal web server.
				// Create it.
				createWebProfile(ppAccessTokenData, (err, ppWebProfile)=>{
					if (err) {
						return cb(err);
					}
					// Save web profile on db.
					redis.set(redisPaypalWebProfileKey, JSON.stringify(ppWebProfile), (err)=>{
						if (err) {
							return cb("Error, saving web profile on redis db: " + err.message);
						}
						else {
							return cb(null, ppWebProfile);
						}
					});
				});
			});
		}
	});
}

// Get web profile from paypal web server.
function getWebProfileFromPaypalWebServer(ppAccessTokenData, cb){
	log.debug(`Retriving web profile from paypal web server.`);
	// log.debug(`${JSON.stringify(ppAccessTokenData, null, 2)}`);
	axios({
		method: 'get',
		url: ppUrl + "payment-experience/web-profiles/",
		headers: {
			"Accept": "application/json", 
			"Accept-Language": "en_US",
			"content-type": "application/x-www-form-urlencoded",
			"Authorization": ppAccessTokenData.token_type + " " + ppAccessTokenData.access_token
		},
	}).then(response => {
		if (response.data.err) {
			return cb(new error(`Retriving web profile from paypal web server. ${response.data.err}`));
		} else {
			let webProfiles = response.data;
			for (let i=0; i < webProfiles.length; i++) {
				if (webProfiles[i].name == ppWebProfileName) {
					let ppWebProfile = webProfiles[i];
					// Webprofile retrived from paypal web server.
					log.debug(`Web profile was retrived from paypal web server: ${JSON.stringify(ppWebProfile, null ,2)}`);
					return cb(null, ppWebProfile); 
				}
			}
			// Not exist web profile on paypal web server.
			return cb(null, null);
		}
	})
	.catch(err => {
		cb(new Error(`Retriving  web profile from payapl web server, ${err.message}`)); 
	}); 
}

// Create web profile.
function createWebProfile(ppAccessTokenData, cb){
	// Get access token from paypal.
	log.debug(`Creating web profile ${ppWebProfileName} on Paypal web server.`);
	axios({
		method: 'post',
		url: ppUrl + "payment-experience/web-profiles/",
		headers: {
			"Accept": "application/json", 
			"Accept-Language": "en_US",
			"Content-Type": "application/json",
			"Authorization": ppAccessTokenData.token_type + " " + ppAccessTokenData.access_token
		},
		data: {
			name: ppWebProfileName,
			presentation: {
				logo_image: "https://www.zunka.com.br/logo.png"
			},
			input_fields: {
				no_shipping: 1,
				address_override: 1
			},
			// flow_config: {
				// landing_page_type: "billing",
				// bank_txn_pending_url: "https://www.paypal.com"
			// }
		}
	})
		.then(response => {
			if (response.data.err) {
				return cb(new Error("Creating web profile on Paypal web service, " + response.data.err));
			} else {
				log.debug(`Web profile was created on payapl web service: ${JSON.stringify(response.data, null, 2)}`);
				return cb(null, response.data);
			}
		})
		.catch(err => {
			cb(new Error("Creating web profile on Paypal web server. " + err.message));
		}); 
}

// Create payment request.
function createPayment(payReqData, cb){
	// Get access token.
	getAccessToken((err, ppAccessTokenData)=>{
		if (err) {
			return cb (err);
		} 	
		getWebProfile(ppAccessTokenData, (err, webProfile)=>{
			if(err) {
				return cb(err);
			}
			payReqData.intent = "authorize";
			payReqData.experience_profile_id = webProfile.id;
			payReqData.payer = { payment_method: "paypal" };
			// log.debug(`payReqData: ${JSON.stringify(payReqData, null, 2)}`);
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
					log.debug(`Created a payment request on payapl web service: ${JSON.stringify(response.data, null, 2)}`);
					return cb(null, response.data);
				}
			}).catch(err => {
				cb(new Error(`Creating payment request on paypal web server. ${err.message}`));
			}); 
		});
	});
}