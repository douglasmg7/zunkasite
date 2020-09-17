'use strict';

const log = require('../config/log');
const axios = require('axios');
const Product = require('../model/product');
const jsdom = require('jsdom');

// Check aldo product quantity.
function checkStock(product, qty, cb) {
    try {
        // Not sell last one.
        let checkQty = qty + 1;

        // To get the last update.
        let now="2018-01-01T00:00:00-03:00";

        let url = `${process.env.ALLNATIONS_HOST}/ConsultaEstoqueProdutos?` +
            `CodigoCliente=${process.env.ALLNATIONS_USER}&` + 
            `Senha=${process.env.ALLNATIONS_PASS}&` +
            `CodigoProduto=${product.dealerProductId}&` +
            `Data=${now}`;
        // console.log(`url: ${url}`);

        let initTime = Date.now();
        axios.get(url)
            .then(response => {
                log.debug(`Time to check allnation stock, product ${product._id}: ${Date.now() - initTime}ms, response.data: ${response.data}`);
                if (response.data.err) {
                    return cb(new Error(`Checking allnations stock. Allnations webservice response.data.err: ${response.data.err}`));
                } 

                // Get information from xml.
                let result = [];
                const dom = new jsdom.JSDOM(response.data);
                let stocks = dom.window.document.querySelectorAll("Estoques");
                stocks.forEach(estoque=>{
                    let stockProduct = {};
                    stockProduct.code = estoque.querySelector("CODIGO").textContent;
                    stockProduct.active = estoque.querySelector("ATIVO").textContent;
                    stockProduct.availability = estoque.querySelector("DISPONIVEL").textContent;
                    stockProduct.stockOrigin = estoque.querySelector("ESTOQUE").textContent;
                    stockProduct.stockQty = estoque.querySelector("ESTOQUEDISPONIVEL").textContent;
                    result.push(stockProduct);
                });

                // Get correct product.
                let receivedProduct;
                result.forEach(stockProduct=>{
                    if (
                        product.dealerProductId == stockProduct.code.trim() &&
                        product.dealerProductLocation.toLowerCase() == stockProduct.stockOrigin.trim().toLowerCase()) 
                    {
                        receivedProduct = {
                            active: stockProduct.active && stockProduct.availability,
                            stock: stockProduct.stockQty
                        }
                    }
                });
                // Have some information.
                if (receivedProduct) {
                    // Update product.
                    let update = { storeProductQtd: receivedProduct.stock, dealerProductActive: receivedProduct.active };
                    if (!receivedProduct.active) {
                        update.storeProductCommercialize = false;
                    }
                    Product.updateOne({ _id: product._id }, update, err=>{
                        if (err) {
                            log.error(`Checking allnations product quantity (Product.updateOne()): ${err.stack}`);
                        } else {
                            log.debug(`Allnations product ${product.dealerProductId} stock was changed to ${parseInt(update.storeProductQtd, 10)}.`);
                        }
                    });
                    // Have stock.
                    if (receivedProduct.active && receivedProduct.stock > checkQty) {
                        return cb(null, true);
                    } 
                    // Not have stock.
                    else {
                        return cb(null, false);
                    }
                } 
                // Could not get product stock.
                else {
                    return cb(new Error(`Checking aldo product quantity. Aldo webservice response.data: ${response.data.err}`));
                }
            })
            .catch(err => {
                return cb(new Error(`Checking allnations stock. axios catch: ${err.stack}`));
            }); 
    } catch(err) {
        return cb(new Error(`Checking allnation stock. catch: ${err}`));
    }
};

module.exports.checkStock = checkStock;
