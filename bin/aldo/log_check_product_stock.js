#!/usr/bin/env node
'use strict';

const axios = require('axios');
const path = require('path');

const checkEnvs = require('./../../util/checkEnvs').check([
    "ALDO_HOST_PRODUCT_STOCK",
    "ALDO_USER",
    "ALDO_PASS",
]);

// Usage.
if (!process.argv[3]) {
    console.log(`Usage: ${path.basename(__filename)} aldo_product_code quantity`);
    process.exit(1);
}

let initTime = Date.now();
checkProductStock();

async function checkProductStock() {
    try {
        let productCode=process.argv[2];
        let productQty=process.argv[3];
        let host=process.env.ALDO_HOST_PRODUCT_STOCK;
        let user=process.env.ALDO_USER;
        let pass=process.env.ALDO_PASS;

        let url = `${host}` +
            `u=${user}&` + 
            `p=${pass}&` + 
            `codigo=${productCode}&` + 
            `qtde=${productQty}&` +
            `emp_filial=1`;

        // let url = `http://webservice.aldo.com.br/asp.net/ferramentas/saldoproduto.ashx?u=146612&p=zunk4c&codigo=${product.dealerProductId}&qtde=${checkQty}&emp_filial=1`;
        console.log(`url: ${url}`);
        return;

        let response = await axios.get(url)
        if (response.data.err) {
            console.error(response.data.err);
            return;
        } 
        console.log(`${response.data}`);

    } catch(err) {
        console.error(err.stack);
        console.log(`Time to process: ${Date.now() - initTime}ms`);
    }; 
}

// let initTime = Date.now();
// axios.get(url)
    // .then(response => {
        // console.log(`Time to process: ${Date.now() - initTime}ms`);
        // if (response.data.err) {
            // console.error(response.data.err);
            // return;
        // } 
        // console.log(`${response.data}`);
    // })
    // .catch(err => {
        // console.log(`Time to process: ${Date.now() - initTime}ms`);
        // console.error(err);
    // }); 
