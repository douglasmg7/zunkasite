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
let bookings = dom.window.document.querySelectorAll("Reservas");
bookings.forEach(booking=>{
    let product = {};
    product.date = booking.querySelector("DATAHORA").textContent;
    product.codeClient = booking.querySelector("CODIGOCLIENTE").textContent;
    product.zunkasiteOrderId = booking.querySelector("CODIGOPEDIDOCLIENTE").textContent;
    product.code = booking.querySelector("CODIGOPRODUTO").textContent;
    product.quantity = booking.querySelector("QUANTIDADE").textContent;
    product.status = booking.querySelector("STATUS").textContent;
    switch(product.status) {
        case "1":
            product.status = "Pending";
            break;
        case "2":
            product.status = "Confirmed";
            break;
        case "3":
            product.status = "GeneratedOrder";
            break;
        case "4":
            product.status = "Canceled";
            break;
    }
    let cpfCnpjFinalClient = booking.querySelector("CPF_CNPJ_ClienteFinal");
    if (cpfCnpjFinalClient) {
        product.cpfCnpjFinalClient = cpfCnpjFinalClient.textContent;
    }
    let priceFinalClient = booking.querySelector("Valor_ClienteFinal");
    if (priceFinalClient) {
        product.priceFinalClient = priceFinalClient.textContent;
    }
    result.push(product);
});
console.log(JSON.stringify(result, null, 2));
