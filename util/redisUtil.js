'use strict';

// Redis.
const log = require('../config/log');
const redis = require('../db/redis');

const PRODUCT_LIST_FILTER_USER = 'product_list_filter_user_';
const DEALER_ACTIVATION = 'dealer_activation_';

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

module.exports.getPorductListFilter = getPorductListFilter;
module.exports.setPorductListFilter = setPorductListFilter;

module.exports.getDealerActivation = getDealerActivation;
module.exports.setDealerActivation = setDealerActivation;
