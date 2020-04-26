#!/usr/bin/env node

'use strict';
const axios = require('axios');
const s = require('../../config/s');

console.log(`${s.zoom.host}/orders`);

axios.get(`${s.zoom.host}/orders`, {
    headers: {
        "Accept": "application/json", 
    },
    auth: {
        username: s.zoom.user,
        password: s.zoom.password
    },
})
.then(response => {
    if (response.data.err) {
        console.error(`Get all zoom orders. ${response.data.err}`);
    } 
    console.log(`orders: ${JSON.stringify(response.data, null, 2)}`);
    // response.data.forEach(order=>{
        // console.log(order.order_number);
        // console.log(order.status);
    // });
})
.catch(err => {
    console.error(`catch(). ${err.stack}`);
}); 
