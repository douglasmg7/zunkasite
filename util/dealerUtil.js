'use strict';
const log = require('../config/log');
const redisUtil = require('../util/redisUtil');
const dealerUtil = require('../util/dealerUtil');
const Product = require('../model/product');
const productUtil = require('./productUtil.js');

let activations = {
    aldo: false,
    allnations: false,
    dell: false,
};

loadActivation();

async function loadActivation(){
    for (let key in activations) {
        try {
            activations[key] = await redisUtil.getDealerActivation(key);
        } 
        catch (err) {
            activations[key] = false;
            log.error(err.message);
        }
    }
};

function isDealerActive(dealer) {
    return activations[dealer.toLowerCase()];
}

async function setDealerActivation(dealer, activation) {
    dealer = dealer.toLowerCase();
    try {
        activations[dealer] = await redisUtil.setDealerActivation(dealer, activation);
    } 
    catch (err) {
        log.error(err.message);
    }
}

function getDealerActivations() {
    return activations;
}

module.exports.isDealerActive = isDealerActive;
module.exports.setDealerActivation = setDealerActivation;
module.exports.getDealerActivations = getDealerActivations;
