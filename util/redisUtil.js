'use strict';

// Redis.
const log = require('../config/log');
const redis = require('../db/redis');

const PRODUCT_LIST_FILTER_USER = 'product_list_filter_user_';
const DEALER_ACTIVATION = 'dealer_activation_';

const MELI_AUTH_CODE = 'meli_auth_code';
const MELI_TOKEN_ACCESS = 'meli_token_access';
const MELI_AUTO_LOAD_TOKEN_ACCESS = 'meli_auto_load_token_access';

///////////////////////////////////////////////////////////////////////////////
// Product list filter
///////////////////////////////////////////////////////////////////////////////
function getPorductListFilter(userId) {
    return new Promise(resolve => {
        let key = PRODUCT_LIST_FILTER_USER + userId;
        // log.debug(`filter key: ${key}`);
        redis.get(key, (err, filter)=>{
            if (err) {
                log.error(new error(`Retriving product list filter user from redis db. ${err.stack}`));
                resolve(null);
            }
            // Already have filter on redis db.
            if (filter) {
                // log.debug(`filter: ${filter}`);
                filter = JSON.parse(filter);
                resolve(filter);
            } 
            resolve(null);
        });
    });
}

function setPorductListFilter(userId, filter) {
    // log.debug(`userId: ${userId}`);
    // log.debug(`filter: ${JSON.stringify(filter, null, 2)}`);
    let strFilter = JSON.stringify(filter);
    redis.set(PRODUCT_LIST_FILTER_USER + userId, strFilter, err=>{
        if (err) {
            log.error(new error(`Setting product list filter user on redis db. ${err.stack}`));
        }
    });
}

///////////////////////////////////////////////////////////////////////////////
// Dealer active
///////////////////////////////////////////////////////////////////////////////
function getDealerActivation(dealer) {
    return new Promise((resolve, reject) => {
        try {
            let key = DEALER_ACTIVATION + dealer;
            redis.get(key, (err, activation)=>{
                if (err) {
                    reject(new Error(`Retriving ${dealer} activation from redis db. ${err.message}`));
                }
                if (activation == null) {
                    reject(new Error(`Retriving ${dealer} activation from redis db. Receive: ${activation}`));
                }
                activation = JSON.parse(activation);
                resolve(activation);
            });
        } 
        catch (err) {
            reject(err);
        }
    });
}

function setDealerActivation(dealer, activation) {
    return new Promise(resolve => {
        let strActivation = JSON.stringify(activation);
        redis.set(DEALER_ACTIVATION + dealer, strActivation, err=>{
            if (err) {
                reject(new Error(`Setting ${dealer} activation on redis db. ${err.message}`));
            } else {
                resolve(activation);
            }
        });
    });
}

///////////////////////////////////////////////////////////////////////////////
// Mercado Livre authorization
///////////////////////////////////////////////////////////////////////////////
// Get meli auth code.
function getMeliAuthCode(dealer) {
    return new Promise((resolve, reject) => {
        try {
            redis.get(MELI_AUTH_CODE, (err, meliAuthCode)=>{
                if (err) {
                    reject(new Error(`Retriving Mercado Livre authorization code from redis db. ${err.message}`));
                }
                if (meliAuthCode == null) {
                    return resolve("");
                }
                return resolve(meliAuthCode);
            });
        } 
        catch (err) {
            reject(err);
        }
    });
}

// Set meli auth code.
function setMeliAuthCode(meliAuthCode) {
    return new Promise(resolve => {
        redis.set(MELI_AUTH_CODE, meliAuthCode, err=>{
            if (err) {
                reject(new Error(`Setting Mercado Livre authorization code on redis db. ${err.message}`));
            } else {
                resolve(meliAuthCode);
            }
        });
    });
}

// Get meli token access.
function getMeliTokenAccess(dealer) {
    return new Promise((resolve, reject) => {
        try {
            redis.get(MELI_TOKEN_ACCESS, (err, tokenAccess)=>{
                if (err) {
                    reject(new Error(`Retriving Mercado Livre token access from redis db. ${err.message}`));
                }
                if (tokenAccess == null) {
                    return resolve(null);
                }
                return resolve(JSON.parse(tokenAccess));
            });
        } 
        catch (err) {
            reject(err);
        }
    });
}

// Set meli token access.
function setMeliTokenAccess(tokenAccess) {
    let strTokenAccess = JSON.stringify(tokenAccess);
    redis.set(MELI_TOKEN_ACCESS, strTokenAccess, err=>{
        if (err) {
            log.error(new Error(`Setting Mercado Livre token access on redis db. ${err.message}`));
        }
    });
}

// Get meli auto load token access configuration.
function getMeliAutoLoadTokenAccess() {
    return new Promise((resolve, reject) => {
        try {
            redis.get(MELI_AUTO_LOAD_TOKEN_ACCESS, (err, config)=>{
                if (err) {
                    reject(new Error(`Retriving auto load token access configuration from redis db. ${err.message}`));
                }
                if (config == null) {
                    return false;
                }
                config = JSON.parse(config);
                resolve(config);
            });
        } 
        catch (err) {
            reject(err);
        }
    });
}

// Set meli auto load token access configuration.
function setMeliAutoLoadTokenAccess(config) {
    return new Promise(resolve => {
        let val = 'false';
        if (config) val = 'true';
        redis.set(MELI_AUTO_LOAD_TOKEN_ACCESS, val, err=>{
            if (err) {
                reject(new Error(`Saving auto load token access configuration to redis db. ${err.message}`));
            }
        });
    });
}

module.exports.getPorductListFilter = getPorductListFilter;
module.exports.setPorductListFilter = setPorductListFilter;

module.exports.getDealerActivation = getDealerActivation;
module.exports.setDealerActivation = setDealerActivation;

module.exports.getMeliAuthCode = getMeliAuthCode;
module.exports.setMeliAuthCode = setMeliAuthCode;

module.exports.getMeliTokenAccess = getMeliTokenAccess;
module.exports.setMeliTokenAccess = setMeliTokenAccess;

module.exports.getMeliAutoLoadTokenAccess = getMeliAutoLoadTokenAccess;
module.exports.setMeliAutoLoadTokenAccess = setMeliAutoLoadTokenAccess;
