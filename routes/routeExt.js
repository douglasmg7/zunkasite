'use strict';
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
const util = require('util');
const s = require('../config/s');
const emailSender = require('../config/email');
const redis = require('../util/redisUtil');

// Models.
const Product = require('../model/product');
const Order = require('../model/order');

// Personal modules.
const log = require('../config/log');
const ppConfig = require('../config/s').paypal;

// Other routes.
const aldo = require('../util/aldo');
const allnations = require('../util/allnations');
const zoom = require('../util/zoom');
const routeCheckout = require('./routeCheckout');

// Mercado Livre
const meli = require('../util/meli.js');

module.exports = router;

// Convert to brazilian currency.
function converToBRCurrencyString(val) {
    return val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


/******************************************************************************
/ Zoom
 ******************************************************************************/
// Zoom hello.
// router.get('/zoom/hello', s.checkZoomAuth, function(req, res, next) {
router.get('/zoom/hello', function(req, res, next) {
    return res.status(200).send('Hello!');
});

// Zoom order status notification.
// router.post('/zoom/order-status', s.checkZoomAuth, function(req, res, next) {
router.post('/zoom/order-status', function(req, res, next) {
    try {
        if (!req.body.status) {
            log.warn(`[zoom] Received zoom product information with unknow status: ${req.body.status}`);
            return res.status(400).send(`Unknown status: ${req.body.status}`);
        }
        if (!req.body.orderNumber) {
            log.warn(`[zoom] Received zoom product information with unknow order number: ${req.body.orderNumber}`);
            return res.status(400).send(`Unknown orderNumber: ${req.body.orderNumber}`);
        }
        // log.debug(`body: ${JSON.stringify(req.body)}`);
        switch (req.body.status.toLowerCase()) {
            case "new":
                log.debug(`[Zoom] New order, order number ${req.body.orderNumber}`);
                // Get zoom order.
                zoom.getZoomOrder(req.body.orderNumber, (err, zoomOrder)=>{
                    if (err) {
                        log.error(err.stack);
                        return res.status(500).send();
                    }
                    createNewZoomOrder(zoomOrder, (err, inStock, msg)=>{
                        if (err) {
                            log.error(err.stack);
                            emailSender.sendMailToDev('Error creating new zoom order.', err.stack);
                            return res.status(500).send('Internal error.');
                        }
                        // Processing order.
                        if (inStock) {
                            return res.status(200).send();
                        } 
                        // Out of stock.
                        else {
                            log.warn(`[zoom] New zoom order created. ${msg}`);
                            emailSender.sendMailToDev('New zoom order created without stock.', msg);
                            return res.status(200).send('Product(s) out of stock.');
                        }
                    });
                });
                break;
            case "approvedpayment":
                log.debug(`[Zoom] Payment approved, order number ${req.body.orderNumber}`);
                // Get zoom order.
                zoom.getZoomOrder(req.body.orderNumber, (err, zoomOrder)=>{
                    if (err) {
                        log.error(err.stack);
                        return res.status(500).send(`Error finding Zoom order ${req.body.orderNumber} at Zoom server.`);
                    }
                    // Request returned order not paided.
                    if (zoomOrder.status.toLowerCase() != 'approvedpayment') {
                        let customErr = new Error(`[zoom] Received zoom notification with order ${zoomOrder.order_number} paided, but a request for zoom server returned not paided.`)
                        log.error(customErr.stack);
                        emailSender.sendMailToDev('Zoom approved payment order error.', customErr.stack);
                        return res.status(500).send('Request to Zoom server returned order not paided.');
                    }
                    // Find zunka order from zoom order.
                    Order.find({externalOrderNumber: zoomOrder.order_number})
                    .then(orders=>{
                        if (orders.length == 0) {
                            let customErr = new Error(`[zoom] Not found zunka order for zoom order number ${zoomOrder.order_number}.`)
                            log.error(customErr.stack);
                            emailSender.sendMailToDev('Zoom approved payment order error.', customErr.stack);
                            return res.status(200).send('No order found');
                        }
                        else if (orders.length > 1 ) {
                            let customErr = new Error(`[zoom] Found more than one zunka order for zoom order number ${zoomOrder.order_number}.`)
                            log.error(customErr.stack);
                            emailSender.sendMailToDev('Zoom approved payment order error.', customErr.stack);
                            return res.status(200).send('Found more than one order');
                        }
                        else {
                            let order = orders[0];
                            order.timestamps.paidAt = new Date();
                            order.status = 'paid';
                            order.save(err=>{
                                if (err) {
                                    let msgErr = `[zoom] Saving zoom order, zunka order id: ${order._id}, zoom order number: ${zoomOrder.order_number}.`;
                                    log.error(`${msgErr}. ${err.stack}`);
                                    emailSender.sendMailToDev('Zoom approved payment order error.', `${msgErr}. ${err.stack}`);
                                    return res.status(500).send();
                                }
                                emailSender.sendMailToAdmin(`Pedido Zoom foi pago`, 'https://www.zunka.com.br/admin/order/' + order._id + '\n\n');
                                return res.status(200).send();
                            });
                        }
                    })
                    .catch(err=>{
                        let msgErr = `[zoom] [catch] Finding zunka order for paided zoom order number: ${zoomOrder.order_number}.`;
                        log.error(`${msgErr}. ${err.stack}`);
                        emailSender.sendMailToDev('Zoom approved payment order catch error.', `${msgErr}. ${err.stack}`);
                        return res.status(500).send('Internal error.');
                    });
                });
                break;
            case "canceled":
                log.debug(`[Zoom] Canceled order, order number ${req.body.orderNumber}`);
                // Get zoom order.
                zoom.getZoomOrder(req.body.orderNumber, (err, zoomOrder)=>{
                    if (err) {
                        log.error(err.stack);
                        return res.status(500).send(`Error finding Zoom order ${req.body.orderNumber} at Zoom server.`);
                    }
                    // Request returned order not canceled.
                    if (zoomOrder.status.toLowerCase() != 'canceled') {
                        let customErr = new Error(`[zoom] Received zoom notification with order ${zoomOrder.order_number} canceled, but a request for zoom server returned not canceled.`)
                        log.error(customErr.stack);
                        emailSender.sendMailToDev('Zoom canceled order error.', customErr.stack);
                        return res.status(500).send('Request to Zoom server returned order not canceled.');
                    }
                    // Find zunka order from zoom order.
                    Order.find({externalOrderNumber: zoomOrder.order_number})
                    .then(orders=>{
                        if (orders.length == 0) {
                            let customErr = new Error(`[zoom] Not found zunka order for zoom order number ${zoomOrder.order_number}.`)
                            log.error(customErr.stack);
                            emailSender.sendMailToDev('Zoom canceled order error.', customErr.stack);
                            // 200 to make zoom stop to send the same message.
                            return res.status(200).send();
                        }
                        else if (orders.length > 1 ) {
                            let customErr = new Error(`[zoom] Found more than one zunka order for zoom order number ${zoomOrder.order_number}.`)
                            log.error(customErr.stack);
                            emailSender.sendMailToDev('Zoom canceled order error.', customErr.stack);
                            // 200 to make zoom stop to send the same message.
                            return res.status(200).send();
                        }
                        else {
                            let order = orders[0];
                            order.timestamps.canceledAt = new Date();
                            order.status = 'canceled';
                            order.save(err=>{
                                if (err) {
                                    let customErr = new Error(`[zoom] Saving zoom order, zunka order id: ${order._id}, zoom order number: ${zoomOrder.order_number}.`)
                                    log.error(customErr.stack);
                                    emailSender.sendMailToDev('Zoom canceled order error.', customErr.stack);
                                    return res.status(500).send();
                                }
                                emailSender.sendMailToAdmin(`Pedido Zoom foi cancelado`, 'https://www.zunka.com.br/admin/order/' + order._id + '\n\n');
                                res.status(200).send();
                                // Update stock.
                                for (var i = 0; i < order.items.length; i++) {
                                    // Not update aldo products, because the actual stock is undetermined.
                                    if (order.items[i].dealerName !== "Aldo") {
                                        Product.updateOne(
                                            { _id: order.items[i]._id },
                                            { $inc: {
                                                storeProductQtd: 1 * order.items[i].quantity,
                                                storeProductQtdSold: -1 * order.items[i].quantity
                                            } }, err=>{
                                                if (err) {
                                                    log.error(err.stack);
                                                }
                                            });
                                    }
                                }
                                return 
                            });
                        }
                    })
                    .catch(err=>{
                        let msgErr = `[zoom] [catch] Finding zunka order for paided zoom order number: ${zoomOrder.order_number}.`;
                        log.error(`${msgErr}. ${err.stack}`);
                        emailSender.sendMailToDev('Zoom canceled order catch error.', `${msgErr}. ${err.stack}`);
                        return res.status(500).send('Internal error.');
                    });
                });
                break;
            default:
                log.debug(`[zoom] Received zoom product information with unknow status: ${req.body.status}`);
                return res.status(400).send(`Unknown status: ${req.body.status}`);
        }
    }
    catch(err){
        log.error(`[catch] Zoom order status notification: ${err.stack}`);
        return res.status(500).send('Internal error.');
    };
});

// Create new zoom order.
function createNewZoomOrder(zoomOrder, cb) {
    // log.debug(`zoomOrder: ${JSON.stringify(zoomOrder, null, 2)}`);
    // Get products itens.
    let items = []
    let totalPrice = 0;
    for (var i = 0; i < zoomOrder.items.length; i++) {
        // Inválid product id.
	    if (!zoomOrder.items[i].product_id.match(/^[a-f\d]{24}$/i)) {
            return cb(new Error(`Creating new zoom order, invalid product id ${zoomOrder.items[i].product_id}`), false, '');
        }
        let item = {
            _id: zoomOrder.items[i].product_id,
            name: zoomOrder.items[i].product_name,
            quantity: zoomOrder.items[i].amount,
            price: zoomOrder.items[i].total.toFixed(2),
            length: 0,
            width: 0,
            height: 0,
            weight: 0
            // price: zoomOrder.product_price.toFixed(2),
        }
        totalPrice += zoomOrder.items[i].total;
        // console.log(`item preço: ${zoomOrder.items[i].total}`);
        items.push(item);
    }
    // Create a new order.
    let order = new Order();
    order.externalOrderNumber = zoomOrder.order_number;
    order.items = items;
    if (zoomOrder.total_discount_value) { totalPrice -= zoomOrder.total_discount_value };
    // console.log(`zoomOrder.total_discount_value: ${zoomOrder.total_discount_value}`);
    // console.log(`zoomOrder.shipping.freight_price: ${zoomOrder.shipping.freight_price}`);
    order.subtotalPrice = totalPrice.toFixed(2);
    order.totalPrice = (totalPrice + zoomOrder.shipping.freight_price).toFixed(2);
    order.user_id = '123456789012345678901234';
    order.name = zoomOrder.customer.first_name;
    order.email = 'zoom@zoom.com.br';
    // order.name = zoomOrder.customer.first_name + zoomOrder.customer.second_name;
    order.cpf = zoomOrder.customer.cpf;
    order.mobileNumber = zoomOrder.customer.user_phone;
    order.timestamps = { 
        shippingAddressSelectedAt: new Date(),
        shippingMethodSelectedAt: new Date(), 
        placedAt: new Date(), 
    };
    order.payment = {};
    order.status = 'placed';

    // Check if all products in stock.
    checkOrderProductsInStock(order)
        .then(result=>{
            let [inStock, productsIdOutOfStock] = result; 
            // Update stock.
            if (inStock) {
                for (var i = 0; i < order.items.length; i++) {
                    Product.updateOne(
                        { _id: order.items[i]._id },
                        { $inc: {
                            storeProductQtd: -1 * order.items[i].quantity,
                            storeProductQtdSold: 1 * order.items[i].quantity
                        } }, err=>{
                            if (err) {
                                log.error(err.stack);
                            }
                        });
                }
            }
            // Save order.
            order.save((err, savedOrder)=>{
                if (err) { 
                    return cb(new Error(`Saving created new zoom order. ${err}`, true, ""));
                }
                if (inStock) {
                    emailSender.sendMailToAdmin(`Novo pedido Zoom`, 'https://www.zunka.com.br/admin/order/' + savedOrder._id + '\n\n');
                    return cb(null, true, "");
                } else {
                    emailSender.sendMailToAdmin(`Novo pedido Zoom - SEM ESTOQUE `, 'https://www.zunka.com.br/admin/order/' + savedOrder._id + '\n\n');
                    return cb(null, false, `Produto(s) ${productsIdOutOfStock.join(', ')} sem disponibilidade na quantidade requerida.`);
                }
            });
        })
        .catch(err=>{
            return cb(new Error(`catch() - Saving created new zoom order. ${err}`, false, ""));
        });    
}

// Check order products in stock.
async function checkOrderProductsInStock(order, cb) {
    // log.debug(`order: ${JSON.stringify(order, null, 2)}`);
    let promises = [];
    // Check stock for each item on order.
    order.items.forEach(item=>{
        promises.push(new Promise((resolve, reject)=>{
            Product.findById(item._id)
                .then(product=>{
                    // log.debug(`checkOrderProductsInStock product: ${JSON.stringify(product, null, 2)}`);
                    // Product not exist.
                    if (!product){
                        resolve([false, item._id]);
                    } 
                    else if (product.dealerName == "Aldo") {
                        aldo.checkAldoProductQty(product, item.quantity, (err, inStock)=>{
                            if (err) {
                                reject(err);
                            }
                            resolve([inStock, item._id]);
                        });
                    }
                    else if (product.dealerName == "Allnations") {
                        allnations.checkStock(product, item.quantity, (err, inStock)=>{
                            if (err) {
                                reject(err);
                            }
                            resolve([inStock, item._id]);
                        });
                    } else {
                        if (product.storeProductQtd >= item.quantity) {
                            resolve([true, item._id]);
                        } else {
                            resolve([false, item._id]);
                        }
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
            let productIdOutOfStock = [];
            results.forEach(result=>{
                let [inStock, product] = result;
                // Some product out of stock.
                if (!inStock) {
                    productIdOutOfStock.push(product);
                }
            });
            // Some products out of stock.
            if (productIdOutOfStock.length) {
                return [false, productIdOutOfStock];
            } else {
                return [true, null];
            }
        }).catch(err=>{
            log.error(`Checking aldo product in stock. ${err.stack}`);
            return false;
        });
}

/******************************************************************************
/ TEST
 ******************************************************************************/

// Test post messages.
router.get('/send-post', (req, res, next)=>{
    res.end("Requesting post.");
    // log.debug(`req.headers: ${JSON.stringify(req.headers, null, 3)}`);
    let t = {a: 'asdf', b: 'zxcv'};
    t = qs.stringify(t);
    log.debug('requesting http post.');
    axios.post('http://localhost:3080/ext/debug-post', t)
        .then(response => {
            // console.log(response);
            log.debug(`headers: ${JSON.stringify(response.headers)}`);
            // log.debug(`data: ${JSON.stringify(response.data, null, 3)}`);
        })
        .catch(err => {
            log.error(err);
        });
});

// Test post messages.
router.post('/debug-post', (req, res, next)=>{
    log.debug('debug-post');
    log.debug(`req.method: ${JSON.stringify(req.method, null, 3)}`);
    log.debug(`req.headers: ${JSON.stringify(req.headers, null, 3)}`);
    log.debug(`req.body: ${JSON.stringify(req.body, null, 3)}`);
    res.end();
});

/******************************************************************************
/ Paypal
 ******************************************************************************/
// Sandbox configurations.
let ppIpnUrl = ppConfig.sandbox.ppIpnUrl;
// Production configurations.
// todo - uncomment.
// if (process.env.NODE_ENV == 'production') {
// ppIpnUrl = ppConfig.production.ppIpnUrl;
// }

// PayPal Plus on approval payment call it on continue.
router.get('/ppp/return/null', (req, res, next)=>{
    res.end("Ok return.");
});

// PayPal Plus on approval payment call it on cancel.
router.get('/ppp/cancel/null', (req, res, next)=>{
    res.end("Ok cancel.");
});

// PayPal Plus IPN listener get.
router.get('/ppp/webhook-listener', (req, res, next)=>{
    log.debug(`headers: ${JSON.stringify(req.headers, null, 2)}`);
    log.debug("IPN Notification Event Received");
    log.error("IPN notification request method not allowed.");
    res.status(405).send("Method Not Allowed");
});

// PayPal Plus IPN listener post.
router.post('/ppp/webhook-listener', (req, res, next)=>{
    try {
        log.debug("IPN Notification Event Received");
        log.debug(`headers: ${JSON.stringify(req.headers, null, 2)}`);
        // log.debug(`body: ${util.inspect(req.body)}`);
        log.debug(`body: ${JSON.stringify(req.body, null, 2)}`);

        // Return empty 200 response to acknowledge IPN post success, so it stop to send the same message.
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", 0);
        res.status(200).end();

        // todo - alternate.
        let payId = req.body.resource.id;
        // let payId =  "PAYID-LVSAEAQ6GM59408ND154300L";
        log.debug(`payId: ${payId}`);

        Order.find({"payment.pppExecutePayment.id": payId}, (err, docs)=>{
            // Error.
            if (err) {
                log.error(`Checking payment complete (webhook event). ${err.message}'`); 
            }
            // No order found.
            else if (docs.length === 0) {
                log.error(`Checking payment complete (webhook event). Not found order with PAYID: ${payId}`); 
            }
            // Inconsistents orders.
            else if (docs.length > 1) {
                log.error(`Checking payment complete (webhook event). Found more than one order for the same PAYID: ${payId}`); 
            }
            else if (docs[0].status === "paid") {
                log.error(`Checking payment complete (webhook event). Order ${docs[0]._id} with PAYID ${payId} alredy paid.`); 
            }
            // Order not paid yet.
            else {
                let order = docs[0];
                log.debug('**** 1 ****');
                // Get payment status from PayPal after some time from webhook event.
                setTimeout(function(){
                    routeCheckout.getPayment(order, (err, payment)=> {
                        // Error.
                        if (err) {
                            log.error(`Checking payment complete (webhook event). ${err.message}`); 
                        }
                        // Order completed.
                        else if (payment.transactions[0].related_resources[0].sale.state == "completed") {
                            log.debug('**** 2 ****');
                            // update order.
                            order.payment.pppExecutePayment.transactions[0].related_resources[0].sale.state = "completed";
                            order.timestamps.paidAt = new Date();
                            order.status = 'paid';
                            order.save(err=>{
                                if (err) {
                                    log.error(`Checking payment complete (webhook event). Saving order. ${err.message}`);
                                } else {
                                    log.info(`Order ${docs[0]._id} with PAYID ${payId} changed pppExecutePayment status to complete.`); 
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
                                        case "ppp-credit":
                                            strPaymentMethod = "Cartão de crédito";
                                            break;
                                        default:
                                            break;
                                    }
                                    // Email to store admin.
                                    let toAdminMailOptions = {
                                        from: '',
                                        to: emailSender.adminEmail,
                                        subject: 'Mudança do status do pedido para pagamento realizado no site Zunka.com.br.',
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
                                        'Método: ' + order.shipping.methodDesc + '\n' +  
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
                                            // log.info(`Email with alert of order paid completed sent to ${emailSender.adminEmail}`);
                                        }
                                    })
                                }
                            });
                        }
                    });
                }, 60000);
            }
        });
    } catch(err) {
        log.error(`Checking payment complete (webhook event). ${err.message}`);
    }
});

/******************************************************************************
/ Mercado Livre
 ******************************************************************************/
router.get('/meli/auth-code/receive', async function(req, res, next) {
    // // todo - remove debug
    log.debug(`Mercado livre auth code url: ${req.url}`);

    let authCode = req.query.code;
    if (authCode) {
        // todo - remove debug
        log.debug(`Mercado livre auth code: ${authCode}`);
        // Save auth code to export to dev.
        meli.setMeliAuthCode(authCode);
        // Enabled auto load token access.
        let autoLoadTokenAccess = await redis.getMeliAutoLoadTokenAccess()
        log.debug(`redis.getMeliAutoLoadTokenAccess: ${autoLoadTokenAccess}`);
        if (autoLoadTokenAccess) {
            // Get token access from meli.
            let accessToken = await meli.getMeliTokenAccessFromMeli(authCode)
            if (accessToken) {
                return res.send('Chave de acesso do Mercado Livre foi atualizada.');
            }
            // Not could take token access from meli.
            else {
                return res.send('Código de autorização do Mercado Livre foi atualizada, mas não foi possível obter a chave de acesso.');
            }
        } 
        // Disabled auto load token access.
        else {
            return res.send('Código de autorização do Mercado Livre foi atualizada.\nMas obtenção de chave de acesso desabilitada no sistema da Zunka.');
        }
    } else { 
        return res.send('Não recebeu código de autorização do Mercado Livre.');
    }
});

    // Handle meli notifications.
router.post('/meli/notifications', async function(req, res, next) {
    try {

        // // todo - remove debug
        log.debug(`Meli notifications: ${req.url}`);
        log.debug(`Meli notifications: ${JSON.stringify(req.body)}`);

        // Check application.
        if (!req.body.application_id || req.body.application_id != process.env.MERCADO_LIVRE_APP_ID) {
            log.warn(`[meli] Received meli notification with unknow application_id: ${req.body.application_id}`);
            return res.status(400).send(`Unknown application_id: ${req.body.application_id}`);
        }

        // Check user id.
        if (!req.body.user_id || req.body.user_id != process.env.MERCADO_LIVRE_USER_ID) {
            log.warn(`[meli] Received meli notification with unknow user_id: ${req.body.user_id}`);
            return res.status(400).send(`Unknown user_id: ${req.body.user_id}`);
        }

        // Topic.
        if (!req.body.topic || req.body.topic != "orders_v2") {
            log.warn(`[meli] Received meli notification with unknow topic`);
            return res.status(400).send(`Unknown topic: ${req.body.topic}`);
        }

        // No resource.
        if (!req.body.resource) {
            log.warn(`[meli] Received meli notification without resource`);
            return res.status(400).send(`Unknown resource: ${req.body.resource}`);
        }

        // Wrong resource start.
        if (!req.body.resource.trim().startsWith("/orders/")) {
            log.warn(`[meli] Received meli notification with invalid resource: ${req.body.resource}`);
            return res.status(400).send(`Unknown resource: ${req.body.resource}`);
        }

        let resources = req.body.resource.trim().replace("/orders/", "");
        resources = resources.split(',');
        // No orders to be processed.
        if (resources[0] == 0) {
            log.warn(`[meli] Received meli notification with no orders resource: ${req.body.resource}`);
            return res.status(400).send(`No orders for resource: ${req.body.resource}`);
        }

        // Processs orders.
        for (const order of resources) {
            log.debug(`Get order: ${order}`);
        }
        log.debug(`Received meli notification ${req.body.topic} with orders: ${resources.join(', ')}`);
        return res.send(`Received meli notification ${req.body.topic} with orders: ${resources.join(', ')}` );
    }
    catch(err){
        log.error(`[catch] meli notifications: ${err.stack}`);
        return res.status(500).send('Internal error.');
    };
});
