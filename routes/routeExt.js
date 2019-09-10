'use strict';
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('querystring');

// Personal modules.
const log = require('../config/log');
const ppConfig = require('../config/s').paypal;

module.exports = router;

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
router.get('/ppp/ipn', (req, res, next)=>{
	log.debug("IPN Notification Event Received");
	log.error("IPN notification request method not allowed.");
	res.status(405).send("Method Not Allowed");
});

// PayPal Plus IPN listener post.
router.post('/ppp/ipn', (req, res, next)=>{
	log.debug("IPN Notification Event Received");
	log.debug(`IPN Notification message: ${JSON.stringify(req.body, null, 2)}`);

	// Return empty 200 response to acknowledge IPN post success, so it stop to send the same message.
	res.header("Cache-Control", "no-cache, no-store, must-revalidate");
	res.header("Pragma", "no-cache");
	res.header("Expires", 0);
	res.status(200).end();

	// // Certify if message is válid.
	// // Convert JSON ipn data to a query string.
	// let ipnTransactionMessage = req.body;
	// let formUrlEncodedBody = qs.stringify(ipnTransactionMessage);
	// // Build the body of the verification post message by prefixing 'cmd=_notify-validate'.
	// let verificationBody = `cmd=_notify-validate&${formUrlEncodedBody}`;
	// log.debug(`verificationBody: ${verificationBody}`);

	// axios.post(ppIpnUrl, verificationBody)
	req.body.cmd = '_notify-validate';
	log.debug('**** 0 ****');
	axios.post(ppIpnUrl, req.body)
	.then(response => {
		log.debug('**** 1 ****');
		log.debug(`response: ${JSON.stringify(response, null, 2)}`);
		log.debug(`response.data: ${JSON.stringify(response.data, null, 2)}`);
		if (response.data == "VERIFIED") {
			log.debug(`Verified IPN: IPN message for Transaction ID: ${ipnTransactionMessage.txn_id} is verified.`);
		}
		else if (response.data === "INVALID"){
			log.debug(`Invalid IPN: IPN message for Transaction ID: ${ipnTransactionMessage.txn_id} is invalid.`);
		}
		else {
			log.debug('Unexpected reponse body.');
		}
	})
	.catch(err => {
		log.debug('**** e ****');
		log.debug(`err.response: ${JSON.stringify(err.response, null, 2)}`);
		log.debug(`err: ${JSON.stringify(err, null, 2)}`);
		return log.debug(new Error(`Sending IPN message to Paypal server. ${JSON.stringify(err.response, null, 3)}`));
	}); 
});