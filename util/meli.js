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

const Product = require('../model/product');
///////////////////////////////////////////////////////////////////////////////
// Token access
///////////////////////////////////////////////////////////////////////////////

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
    // log.debug(`Mercado Livre authorization code: ${meliAuthCode}`);
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
    // log.debug(`Mercado Livre token access: ${util.inspect(meliTokenAccess)}`);
}

// Get access code from meli.
async function getMeliTokenAccessFromMeli(authCode){
    try {
        let data = {
            grant_type: 'authorization_code',
            client_id: process.env.MERCADO_LIVRE_APP_ID,
            client_secret: process.env.MERCADO_LIVRE_SECRET_KEY,
            code: authCode,
            redirect_uri: process.env.MERCADO_LIVRE_REDIRECT_URL_ZUNKASITE,
        };

        log.debug(`data: ${JSON.stringify(data, null, 4)}`);
        let response = await axios.post(MELI_TOKEN_URL, 
            data,
            {
                headers: {
                    'Accept': 'application/json', 
                    'content-type': 'application/x-www-form-urlencoded',
                },
            }
        );
        // log.debug(`response.data: ${util.inspect(response.data)}`);
        if (response.data.err) {
            log.error(new Error(`requesting meli access token. ${response.data.err}`));
            return false;
        } else {
            // Give 10 seconds less to expire.
            response.data.expires_at = Date.now() + ((response.data.expires_in - 10) * 1000);
            // todo - comment debug
            log.debug(`Token access received from meli server: ${util.inspect(response.data)}`);
            setMeliTokenAccess(response.data);
            return response.data;
        }
    } catch(err) {
        // log.debug(`err.response: ${JSON.stringify(err, null, 4)}`);
        if (err.response) {
            // log.debug(`err response status: ${err.response.status}`);
            // log.debug(`err response headers: ${JSON.stringify(err.response.headers, null, 4)}`);
            log.error(`requesting meli access token. ${JSON.stringify(err.response.data, null, 4)}`);
        } else if (err.request) {
            log.error(`requesting meli access token. ${JSON.stringify(err.request, null, 4)}`);
        } else {
            log.error(`requesting meli access token. ${err.stack}`);
        }
        return false;
    }
};

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

///////////////////////////////////////////////////////////////////////////////
// Categories
///////////////////////////////////////////////////////////////////////////////

// Get meli category.
function getMeliCategory(categoryId) {
    return new Promise(async(resolve, reject)=> {
        try {
            let url = `${MELI_API_URL}/categories/${categoryId}`
            let response = await axios.get(url);
            if (response.data.err) {
                return reject(response.data.err);
            }
            resolve(response.data);
        } catch(err) {
            reject(err);
        }
    });
}

// Get meli category attributes.
async function getMeliCategoryAttributes(categoryId) {
        return new Promise(async(resolve, reject)=> {
            try {
                let url = `${MELI_API_URL}/categories/${categoryId}/attributes`
                let response = await axios.get(url);
                if (response.data.err) {
                    return reject(response.data.err);
                }
                let attributes = [];
                for (let attribute of response.data) {
                    // log.debug(`attribute id: ${attribute.id.trim().toLowerCase()}`);
                    if (attribute.tags.required || attribute.tags.catalog_required || (attribute.id.trim().toLowerCase() == 'gtin')) {
                        attributes.push(attribute);
                    }
                }
                resolve(attributes);
            } catch(err) {
                reject(err);
            }
        });
}

// Get meli orders.
async function getMeliOrders(orders_ids) {
    return new Promise(async(resolve, reject)=> {
        try {
            let tokenAccess = await tryToGetTokenAccess();
            if (tokenAccess) {
                log.debug(`orders_ids: ${orders_ids}`);
                let url = `${MELI_API_URL}/orders/${orders_ids.join(',')}`
                log.debug(`getMeliOrders url: ${url}`);
                let response = await axios.get(url, {
                    headers: {Authorization: `Bearer ${tokenAccess}`}
                });
                if (response.data.err) {
                    log.debug(`*** reject ***`);
                    log.debug(`${response.data.err}`);
                    return reject(response.data.err);
                }
                let orders = [];
                log.debug(`getMeliOrders response.data: ${response.data}`);
                for (let order of response.data) {
                    orders.push(order);
                }
                resolve(roders);
            } else {
                reject(new Error(`No tokenAccess`));
            }
        } catch(err) {
            reject(err);
        }
    });
}


// Update zunka stock.
function updateZunkaStock(zunkaId, newStock) {
    Product.updateOne({ _id: zunkaId}, { storeProductQtd: newStock }, err=>{
        if (err) {
            log.error(err.stack);
        }
    });
}


// Get token access.
// If invalid token try to get from meli.
// If expired, try to refresh.
async function tryToGetTokenAccess() {
    let tokenAccess = getMeliTokenAccess();

    // Not token access yet.
    if (!tokenAccess) {
        // Try get from current authorization code.
        tokenAccess = await getMeliTokenAccessFromMeli();
        // Need get authorization code first.
        if (!tokenAccess) {
            // Todo - send email
            log.debug('tryToGetTokenAccess() - Need get authorization code from meli');
            return 
        }
    }

    // Check if expired.
    let time_to_expire = tokenAccess.expires_at - Date.now();
    log.debug(`Time to expire meli token (min): ${Math.floor(time_to_expire / 60000)}`);

    // Expired.
    if (time_to_expire <= 0) {
        try 
        {
            let url = 
                meli.MELI_TOKEN_URL +
                '?grant_type=refresh_token&' +
                `client_id=${process.env.MERCADO_LIVRE_APP_ID}` +
                `&client_secret=${process.env.MERCADO_LIVRE_SECRET_KEY}` +
                `&refresh_token=${tokenAccess.refresh_token}`; 
            log.debug(`meli refresh url: ${url}`);

            // Refresh token access.
            let response = await axios.post(url);
            // log.debug(`response.data: ${util.inspect(response.data)}`);
            if (response.data.err) {
                log.error(new Error(`Refreshing meli token access. ${response.data.err}`));
                // Todo - send email
                return;
            } else {
                // // Give 10 seconds less to expire.
                response.data.expires_at = Date.now() + ((response.data.expires_in - 10) * 1000);
                // todo - comment debug
                log.debug(`meli token access refreshed, response.data: ${util.inspect(response.data)}`);
                meli.setMeliTokenAccess(response.data);
                return response.data;
            }
        } catch(err) {
            if (err.response) {
                // log.debug(`err response status: ${err.response.status}`);
                // log.debug(`err response headers: ${JSON.stringify(err.response.headers, null, 4)}`);
                log.error(`Refreshing meli token access. ${JSON.stringify(err.response.data, null, 4)}`);
                // Todo - send email
                return;
            } else if (err.request) {
                log.error(`Refreshing meli token access. ${JSON.stringify(err.request, null, 4)}`);
                // Todo - send email
                return;
            } else {
                log.error(`Refreshing meli token access. ${err.stack}`);
                // Todo - send email
                return;
            }
        }
    } 
    // Token access not expired.
    else {
        return tokenAccess;
    }
};

module.exports.getAuthorizationURL = getAuthorizationURL;

module.exports.getMeliAuthCode = getMeliAuthCode;
module.exports.setMeliAuthCode = setMeliAuthCode;

module.exports.getMeliTokenAccess = getMeliTokenAccess;
module.exports.setMeliTokenAccess = setMeliTokenAccess;

module.exports.getMeliTokenAccessFromMeli = getMeliTokenAccessFromMeli;

module.exports.MELI_API_URL = MELI_API_URL;
module.exports.MELI_TOKEN_URL = MELI_TOKEN_URL;

module.exports.getMeliCategory = getMeliCategory;
module.exports.getMeliCategoryAttributes = getMeliCategoryAttributes;

module.exports.getMeliOrders = getMeliOrders;
