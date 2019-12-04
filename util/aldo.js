'use strict';

const log = require('../config/log');
const axios = require('axios');
const Product = require('../model/product');

// Check aldo product quantity.
function checkAldoProductQty(product, qty, cb) {
    try {
        // Check quantity have a margin.
        let checkQty = qty + 2;
        let url = `http://webservice.aldo.com.br/asp.net/ferramentas/saldoproduto.ashx?u=146612&p=zunk4c&codigo=${product.dealerProductId}&qtde=${checkQty}&emp_filial=1`;
        // log.debug(url);
        axios.get(url)
        .then(response => {
            if (response.data.err) {
                return cb(new Error(`Checking aldo product quantity. Aldo webservice response.data.err: ${response.data.err}`));
            } else {
                // log.debug(`response.data: ${response.data}`);
                if (response.data === "SIM") {
                    return cb(null, true);
                } 
                else if (response.data === "NÃO"){
                    // if check result was for one product.
                    if (qty == 1) {
                        // Update product quantity to 0.
                        Product.updateOne({ _id: product._id }, { storeProductQtd: 0}, err=>{
                            if (err) {
                                log.error(`Checking aldo product quantity (Product.updateOne()): ${err.stack}`);
                            } else {
                                log.debug(`Aldo product ${product.dealerProductId} out of stock.`);
                            }
                        });
                    }
                    return cb(null, false);
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
