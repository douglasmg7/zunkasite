'use strict';

const log = require('../config/log');
const axios = require('axios');

// Redis
const redisUtil = require('../util/redisUtil.js');

const MERCADO_LIVRE_AUTH_URL = "http://auth.mercadolivre.com.br/authorization" ;
// const MERCADO_LIVRE_AUTH_URL = "http://auth.mercadolibre.com.ar/authorization" ;

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
        // todo - comment
        log.debug(`URL to get meli authorization code: ${url}`);

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

module.exports.getAuthorization = getAuthorization;

module.exports.getMeliAuthCode = getMeliAuthCode;
module.exports.setMeliAuthCode = setMeliAuthCode;
