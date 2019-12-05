'use strict';

const log = require('../config/log');
const axios = require('axios');
const Product = require('../model/product');

// Check aldo product quantity.
function checkAldoProductQty(product, qty, cb) {
    try {
        // Not sell last one.
        let checkQty = qty + 1;
        let url = `http://webservice.aldo.com.br/asp.net/ferramentas/saldoproduto.ashx?u=146612&p=zunk4c&codigo=${product.dealerProductId}&qtde=${checkQty}&emp_filial=1`;
        // log.debug(url);
        // Time to process request.
        let initTime = Date.now();
        axios.get(url)
        .then(response => {
            log.debug(`Time to process aldo check product quantity, product ${product._id}: ${Date.now() - initTime}ms, response.data: ${response.data}`);
            if (response.data.err) {
                return cb(new Error(`Checking aldo product quantity. Aldo webservice response.data.err: ${response.data.err}`));
            } else {
                // log.debug(`response.data: ${response.data}`);
                if (response.data === "SIM") {
                    return cb(null, true);
                } 
                else if (response.data === "NÃO"){
                    // Update product quantity.
                    Product.updateOne({ _id: product._id }, { storeProductQtd: qty - 1 }, err=>{
                        if (err) {
                            log.error(`Checking aldo product quantity (Product.updateOne()): ${err.stack}`);
                        } else {
                            log.debug(`Aldo product ${product.dealerProductId} quantity in stock was changed to ${qty - 1}.`);
                        }
                        return cb(null, false);
                    });
                }
                else {
                    return cb(new Error(`Checking aldo product quantity. Aldo webservice response.data: ${response.data.err}`));
                }
            }
        })
        .catch(err => {
            return cb(new Error(`Checking aldo product quantity. axios catch: ${err}`));
        }); 
    } catch(err) {
        return cb(new Error(`Checking aldo product quantity. catch: ${err}`));
    }
};

module.exports.checkAldoProductQty = checkAldoProductQty;
