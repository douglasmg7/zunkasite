#!/usr/bin/env node
'use strict';
const axios = require('axios');
const path = require('path');

// Usage.
if (!process.argv[4]) {
    console.log(`Usage: ${path.basename(__filename)} zunkasite_order_id allnations_product_code product_quantity`);
    process.exit(1);
}

let url = `${process.env.ALLNATIONS_HOST}/InserirReserva?` +
    `CodigoCliente=${process.env.ALLNATIONS_USER}&` + 
    `Senha=${process.env.ALLNATIONS_PASS}&` +
    `PedidoCliente=${process.argv[2]}&` +
    `CodigoProduto=${process.argv[3]}&` +
    `Qtd=${process.argv[4]}`;

// console.log(`url: ${url}`);

axios.get(url)
    .then(response => {
        if (response.data.err) {
            console.error(response.data.err);
        } 
        console.log(`${response.data}`);
    })
    .catch(err => {
        console.error(`catch(). ${err}`);
    }); 
