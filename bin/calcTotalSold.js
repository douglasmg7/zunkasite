#!/usr/bin/env node
'use strict';
const mongoose = require('../db/mongoose');
const Order = require('../model/order');
const log = require('../config/log');

function toBrMoney(val) {
    return 'R$' + val.toFixed(0).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Remove old values.
log.info('Getting paid, shipped and delivered orders...');

// Total.
let totalSold = 0;
let statusMap = new Map();

// Order.find({status: {$nin: ["placed", "canceled"]}}).sort({ "timestamps.paidAt": 1 })
Order.find({status: {$in: ["paid", "shipped", "delivered"]}}).sort({ "timestamps.paidAt": 1 })
.then(docs=>{
    docs.forEach(order=>{
        // log.debug(`${parseFloat(order.subtotalPrice)}`);
        totalSold = totalSold + parseFloat(order.subtotalPrice);
        statusMap.set(order.status, true);
        let tmpDate = new Date(order.timestamps.placedAt);
        log.debug(`${totalSold.toFixed(0)} (${parseFloat(order.subtotalPrice).toFixed(0)})  ->  ${tmpDate.toDateString()} - ${order.name} `);
        // log.debug(`${totalSold.toFixed(0)} (${parseFloat(order.subtotalPrice).toFixed(0)})  ->  ${order.timestamps.placedAt} - ${order.name} `);
        // log.debug(`${totalSold.toFixed(0)} (${parseFloat(order.subtotalPrice).toFixed(0)})  ->  ${order.timestamps} - ${order.name} `);
    });
    statusMap.forEach((val, key)=>{
        log.debug(`- ${key} -`);
    });
    log.debug(`Quantity: ${docs.length}`);
    log.debug(`sold: ${toBrMoney(totalSold)}`);
    log.debug(`markup: ${toBrMoney(totalSold * .3)}`);
    mongoose.close(()=>{
        process.exit();
    });
})
.catch(err=>{
    log.error(err);
});

