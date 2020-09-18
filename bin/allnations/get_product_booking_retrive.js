#!/usr/bin/env node
'use strict';

const axios = require('axios');
const path = require('path');

// Usage.
if (!process.argv[2]) {
    console.log(`Usage: ${path.basename(__filename)} numero_pedido`);
    process.exit(1);
}

let url = `${process.env.ALLNATIONS_HOST}/RetornarReservas?` +
    `CodigoCliente=${process.env.ALLNATIONS_USER}&` + 
    `Senha=${process.env.ALLNATIONS_PASS}&` +
    `PedidoCliente=${process.argv[2]}`;

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
