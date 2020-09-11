#!/usr/bin/env node
'use strict';

const fs = require("fs");

const path = require('path');
// const xml2js = require('xml2js');
const jsdom = require('jsdom');

let xml = fs.readFileSync(0).toString(); // STDIN_FILENO = 0

// console.log(xml);

// xml2js.parseString(response.data, (err, result) => {
// if (err) {
// return console.error(err);
// }
// console.log(result.DataSet["diffgr:diffgram"][0].NewDataSet);
// });

let result = [];

const dom = new jsdom.JSDOM(xml);
let estoques = dom.window.document.querySelectorAll("Estoques");
estoques.forEach(estoque=>{
    let product = {};
    product.code = estoque.querySelector("CODIGO").textContent;
    product.active = estoque.querySelector("ATIVO").textContent;
    product.availability = estoque.querySelector("DISPONIVEL").textContent;
    product.stockOrigin = estoque.querySelector("ESTOQUE").textContent;
    product.stockQty = estoque.querySelector("ESTOQUEDISPONIVEL").textContent;
    result.push(product);
});
console.log(JSON.stringify(result, null, 2));
