#!/usr/bin/env node
'use strict';
const mongoose = require('../db/mongoose');
const Order = require('../model/order');
const log = require('../config/log');

// Remove old values.
log.info('Geting shipped, delivered and paid orders...');

// Total.
let totalSold = 0;
let statusMap = new Map();

Order.find({status: {$nin: ["placed", "canceled"]}})
.then(docs=>{
    docs.forEach(order=>{
        // log.debug(`${parseFloat(order.subtotalPrice)}`);
        totalSold = totalSold + parseFloat(order.subtotalPrice);
        statusMap.set(order.status, true);
    });
    statusMap.forEach((val, key)=>{
        log.debug(`- ${key} -`);
    });
    log.debug(`sold: ${totalSold.toFixed(0)}`);
    log.debug(`markup: ${(totalSold * .3).toFixed(0)}`);
    mongoose.close(()=>{
        process.exit();
    });
})
.catch(err=>{
    log.error(err);
});
