'use strict';
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
const util = require('util');
const s = require('../config/s');
const emailSender = require('../config/email');

// Models.
const Order = require('../model/order');

// Personal modules.
const log = require('../config/log');
const ppConfig = require('../config/s').paypal;

// Other routes.
const routeCheckout = require('./routeCheckout');

module.exports = router;

// Convert to brazilian currency.
function converToBRCurrencyString(val) {
	return val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


/******************************************************************************
/ Zoom
 ******************************************************************************/

// Zoom order status notification.
router.post('/zoom/order-status', s.basicAuth, function(req, res, next) {
    log.debug(`body: ${JSON.stringify(req.body)}`);

    switch (req.body.status.toLowerCase()) {
        case "new":
            log.debug("new");
            // Send email.
            // Get order information.
            break;

        case "approvedpayment":
            log.debug("approvedpayment");
            // Send email.
            // Get order information.
            break;
        case "canceled":
            log.debug("canceled");
            // Send email.
            break;
        default:
            log.error(`Received zoom product information with status: ${req.body.status}`);
            return res.status(400).send(`Unknown status: ${req.body.status}`);
    }
    return res.status(200).send();
});


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

// // PayPal Plus IPN listener post.
// router.post('/ppp/ipn', (req, res, next)=>{
	// log.debug("IPN Notification Event Received");
	// log.debug(`headers: ${JSON.stringify(req.headers, null, 2)}`);
	// log.debug(`body: ${util.inspect(req.body)}`);

	// // Return empty 200 response to acknowledge IPN post success, so it stop to send the same message.
	// res.header("Cache-Control", "no-cache, no-store, must-revalidate");
	// res.header("Pragma", "no-cache");
	// res.header("Expires", 0);
	// res.status(200).end();

	// // // Certify if message is válid.
	// // // Convert JSON ipn data to a query string.
	// // let ipnTransactionMessage = req.body;
	// // let formUrlEncodedBody = qs.stringify(ipnTransactionMessage);

	// // // Build the body of the verification post message by prefixing 'cmd=_notify-validate'.
	// // let verificationBody = `cmd=_notify-validate&${formUrlEncodedBody}`;
	// // // let verificationBody = `cmd=_notify-validate&${req.body}`;

	// // log.debug(`verificationBody: ${verificationBody}`);

	// // log.debug('**** 0 ****');
	// // axios.post(ppIpnUrl, verificationBody)
	// // .then(response => {
		// // log.debug('**** 1 ****');
		// // log.debug(`response: ${response}`);
		// // // log.debug(`response: ${util.inspect(response)}`);
		// // if (response.data == "VERIFIED") {
			// // // log.debug(`Verified IPN: IPN message for Transaction ID: ${ipnTransactionMessage.txn_id} is verified.`);
			// // log.debug(`Verified IPN.`);
		// // }
		// // else if (response.data === "INVALID"){
			// // // log.debug(`Invalid IPN: IPN message for Transaction ID: ${ipnTransactionMessage.txn_id} is invalid.`);
			// // log.debug(`Invalid IPN.`);
		// // }
		// // else {
			// // log.debug('Unexpected reponse body.');
		// // }
	// // })
	// // .catch(err => {
		// // log.error(`Sending IPN message to Paypal server. ${err}`);
	// // }); 
// });