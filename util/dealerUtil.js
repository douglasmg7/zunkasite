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

////////////////////////////////////////////////////////////////////////////////
// Aldo
////////////////////////////////////////////////////////////////////////////////
function setAladoActivation(activation) {
    try {
        aldoActivation = await redisUtil.setDealerActivation('aldo', activation);
    } 
    catch (err) {
        log.error(err.message);
    }
}

function isAldoProductsActive() {
    return aldoActivation;
}

////////////////////////////////////////////////////////////////////////////////
// Allnations
////////////////////////////////////////////////////////////////////////////////
function isAllnationsProductsActive() {
    return allnationsActivation;
}

function setAllnationsActivation(activation) {
    try {
        allnationsActivation = await redisUtil.setDealerActivation('allnations', activation);
    } 
    catch (err) {
        log.error(err.message);
    }
}


module.exports.isAldoProductsActive = isAldoProductsActive;
module.exports.setAladoActivation = setAladoActivation;

module.exports.isAllnationsProductsActive = isAllnationsProductsActive;
module.exports.setAllnationsActivation = setAllnationsActivation;
