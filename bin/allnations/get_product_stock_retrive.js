#!/usr/bin/env node
'use strict';

const axios = require('axios');
const path = require('path');

// Usage.
if (!process.argv[2]) {
    console.log(`Usage: ${path.basename(__filename)} codigo_produto`);
    process.exit(1);
}

let now="2018-01-01T00:00:00-03:00";

let url = `${process.env.ALLNATIONS_HOST}/ConsultaEstoqueProdutos?` +
    `CodigoCliente=${process.env.ALLNATIONS_USER}&` + 
    `Senha=${process.env.ALLNATIONS_PASS}&` +
    `CodigoProduto=${process.argv[2]}&` +
    `Data=${now}`;

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
