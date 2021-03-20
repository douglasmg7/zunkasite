'use strict';

const log = require('../config/log');
const axios = require('axios');
const Product = require('../model/product');
const jsdom = require('jsdom');
const emailSender = require('../config/email');

// Redis
const redisUtil = require('../util/redisUtil.js');


// Min stock quantity in stock dealer to permit sell.
const MIN_STOCK_TO_SELL = 1;




const MERCADO_LIVRE_AUTH_URL = "http://auth.mercadolivre.com.br/authorization" ;

let meliAuthCode;

loadMeliAuthCode();

// Mercado livre authorization code
function getMeliAuthCode() {
    return meliAuthCode;
}
function setMeliAuthCode(authCode) {
    meliAuthCode = authCode;
    redisUtil.setMeliAuthCode(meliAuthCode);
}
async function loadMeliAuthCode() {
    meliAuthCode = await redisUtil.getMeliAuthCode();
    // todo - remove debug
    log.debug(`Mercado Livre authorization code: ${meliAuthCode}`);
}

// Get authorization
async function getAuthorization() {
    try{
        let url = MERCADO_LIVRE_AUTH_URL + 
            "?response_type=code&" +
            `client_id=${process.env.MERCADO_LIVRE_USER_ID}&` + 
            `redirect_uri=${process.env.MERCADO_LIVRE_REDIRECT_URL_ZUNKASITE}`;

        let response = await axios.get(url);
        if (response.data.err) {
            log.error(response.data.err);
			return next(response.data.err);
        } 
    } catch(err) {
        log.error(`catch - Getting allnations booking information. ${err.stack}`);
        return null;
    }
}

module.exports.getMeliAuthCode = getMeliAuthCode;
module.exports.setMeliAuthCode = setMeliAuthCode;
