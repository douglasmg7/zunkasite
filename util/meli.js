'use strict';

const log = require('../config/log');
const axios = require('axios');

// Redis
const redisUtil = require('../util/redisUtil.js');

const MELI_AUTH_URL = "https://auth.mercadolivre.com.br/authorization" ;
// const MELI_AUTH_URL = "http://auth.mercadolibre.com.ar/authorization" ;

const MELI_API_URL = 'https://api.mercadolibre.com';


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
function getAuthorizationURL() {
    let url = MELI_AUTH_URL + 
        "?response_type=code&" +
        `client_id=${process.env.MERCADO_LIVRE_APP_ID}&` + 
        `redirect_uri=${process.env.MERCADO_LIVRE_REDIRECT_URL_ZUNKASITE}`;
    // todo - comment
    log.debug(`URL to get meli authorization code: ${url}`);
    return url;
}

// // Get authorization
// async function getAuthorization() {
    // try{
        // let url = MELI_AUTH_URL + 
            // "?response_type=code&" +
            // `client_id=${process.env.MERCADO_LIVRE_APP_ID}&` + 
            // `redirect_uri=${process.env.MERCADO_LIVRE_REDIRECT_URL_ZUNKASITE}`;
        // // todo - comment
        // log.debug(`URL to get meli authorization code: ${url}`);

        // let response = await axios.get(url);
        // if (response.data.err) {
            // log.error(response.data.err);
			// return next(response.data.err);
        // } 
        // log.debug(`response: ${JSON.stringify(response.data, null, 2)}`);
    // } catch(err) {
        // log.error(`catch - Getting allnations booking information. ${err.stack}`);
        // return null;
    // }
// }

module.exports.getAuthorizationURL = getAuthorizationURL;

module.exports.getMeliAuthCode = getMeliAuthCode;
module.exports.setMeliAuthCode = setMeliAuthCode;

module.exports.MELI_API_URL = MELI_API_URL;
