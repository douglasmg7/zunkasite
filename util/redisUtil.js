'use strict';

// Redis.
const log = require('../config/log');
const redis = require('../db/redis');

const PRODUCT_LIST_FILTER_USER = 'product_list_filter_user_';

function getPorductListFilter(userId) {
    return new Promise(resolve => {
        let key = PRODUCT_LIST_FILTER_USER + userId;
        // log.debug(`filter key: ${key}`);
        redis.get(key, (err, filter)=>{
            if (err) {
                log.error(new error(`Retriving product list filter user from redis db. ${err.message}`));
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
            log.error(new error(`Setting product list filter user from redis db. ${err.message}`));
        }
    });
}

module.exports.getPorductListFilter = getPorductListFilter;
module.exports.setPorductListFilter = setPorductListFilter;
