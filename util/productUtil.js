'use strict';

const log = require('../config/log');
const Product = require('../model/product');

function updateCommercializeStatus() {
    try {
        // Get all products not deleted.
        Product.find({deletedAt: {$exists: false}})
        .then(products=>{
            let productsByzunkaId = new Map();
            for (let product of products) {
                // create zunka id map
                if (product.storeProductId) {
                    let productArray = productsByzunkaId.get(product.storeProductId);
                    if (productArray) {
                        productArray.push(product);
                    } else {
                        let productArray = [];
                        productArray.push(product);
                        productsByzunkaId.set(product.storeProductId, productArray);
                    }
                }
                // log.debug(`*** product to check: ${product.storeProductTitle}`);
            }
            log.debug('*** 0 ***');
            for (let [key, value] of productsByzunkaId) {
                if (value.length > 1) {
                    log.debug(`*** key: ${key}`);
                    log.debug(`*** value: ${value[0].storeProductTitle}`);
                    log.debug(`*** value: ${value[1].storeProductTitle}`);
                }
            }
        })
        .catch(err=>{
            log.error(err.stack);
        });
    } catch(err) {
        log.error(new Error(`Setting cheapest product to commercialize. catch: ${err}`));
    }
};

// // Check aldo product quantity.
// function setCheapestProductToCommercialize(zunkaCodeProduct) {
    // try {
        // log.debug(`*** zunkaCodeProduct: ${zunkaCodeProduct}`);
        // if (!zunkaCodeProduct) {
            // return;
        // }
        // Product.find({storeProductId: zunkaCodeProduct})
        // .then(products=>{
            // for (let product of products) {
                // log.debug(`*** product to check: ${product.storeProductTitle}`);
            // }
        // })
        // .catch(err=>{
            // log.error(err.stack);
        // });
    // } catch(err) {
        // log.error(new Error(`Setting cheapest product to commercialize. catch: ${err}`));
    // }
// };

module.exports.updateCommercializeStatus = updateCommercializeStatus;
