'use strict';
const log = require('../config/log');
const redisUtil = require('../util/redisUtil');
const dealerUtil = require('../util/dealerUtil');
const Product = require('../model/product');

let aldoActivation;
let allnationsActivation;

loadActivation();

async function loadActivation(){
    // aldo
    try {
        aldoActivation = await redisUtil.getDealerActivation('aldo');
    } 
    catch (err) {
        aldoActivation = false;
        log.error(err.message);
    }

    // allnations
    try {
        allnationsActivation = await redisUtil.getDealerActivation('allnations');;
    } 
    catch (err) {
        allnationsActivation = false;
        log.error(err.message);
    }

    log.info(`Aldo products ${aldoActivation ? 'active': 'inactive'}`);
    log.info(`Allnations products ${allnationsActivation ? 'active': 'inactive'}`);
};

function isAldoProductsActive() {
    return aldoActivation;
}

function isAllnationsProductsActive() {
    return allnationsActivation;
}

module.exports.isAldoProductsActive = isAldoProductsActive;
module.exports.isAllnationsProductsActive = isAllnationsProductsActive;
