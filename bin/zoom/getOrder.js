#!/usr/bin/env node
'use strict';
const axios = require('axios');
const s = require('../../config/s');

axios.get(`${s.zoom.host}/order/31559839856`, {
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
        log.error(response.data.err);
    } 
    console.log(`${JSON.stringify(response.data, null, 2)}`);
})
.catch(err => {
    log.error(`catch(). ${err}`);
}); 
