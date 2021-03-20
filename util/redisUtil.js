'use strict';

// Redis.
const log = require('../config/log');
const redis = require('../db/redis');

const PRODUCT_LIST_FILTER_USER = 'product_list_filter_user_';
const DEALER_ACTIVATION = 'dealer_activation_';

const MELI_AUTH_CODE = 'meli_auth_code';

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
// Mercado Livre authorization code
///////////////////////////////////////////////////////////////////////////////
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

module.exports.getPorductListFilter = getPorductListFilter;
module.exports.setPorductListFilter = setPorductListFilter;

module.exports.getDealerActivation = getDealerActivation;
module.exports.setDealerActivation = setDealerActivation;

module.exports.getMeliAuthCode = getMeliAuthCode;
module.exports.setMeliAuthCode = setMeliAuthCode;
