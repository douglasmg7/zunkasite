'use strict';

const log = require('../config/log');
const axios = require('axios');

// Redis
const redisUtil = require('../util/redisUtil.js');

// meli api
const MELI_API_URL = 'https://api.mercadolibre.com';

// meli auth
const MELI_AUTH_URL = 'https://auth.mercadolivre.com.br/authorization' ;
// const MELI_AUTH_URL = "http://auth.mercadolibre.com.ar/authorization" ;

// meli token
const MELI_TOKEN_URL = `${MELI_API_URL}/oauth/token` ;

// Util.
const util = require('util');


let meliAuthCode;
loadMeliAuthCode();

let meliTokenAccess;
loadMeliTokenAccess();

// Mercado livre authorization code.
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

// Mercado livre token access.
function getMeliTokenAccess() {
    return meliTokenAccess;
}
function setMeliTokenAccess(tokenAccess) {
    meliTokenAccess = tokenAccess;
    redisUtil.setMeliTokenAccess(meliTokenAccess);
}
async function loadMeliTokenAccess() {
    meliTokenAccess = await redisUtil.getMeliTokenAccess();
    // todo - remove debug
    log.debug(`Mercado Livre token access: ${util.inspect(meliTokenAccess)}`);
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

module.exports.getAuthorizationURL = getAuthorizationURL;

module.exports.getMeliAuthCode = getMeliAuthCode;
module.exports.setMeliAuthCode = setMeliAuthCode;

module.exports.getMeliTokenAccess = getMeliTokenAccess;
module.exports.setMeliTokenAccess = setMeliTokenAccess;

module.exports.MELI_API_URL = MELI_API_URL;
module.exports.MELI_TOKEN_URL = MELI_TOKEN_URL;
