#!/usr/bin/env node
'use strict';
const mongoose = require('../db/mongoose');
const ShippingPrice = require('../model/shippingPrice');
const log = require('../config/log');

const prices = [
  { region: 'north', deadLine: 10, maxWeight: 1000000, price: 8000 },
  { region: 'north', deadLine: 2, maxWeight: 1000000, price: 8000 },
  { region: 'northeast', deadLine: 10, maxWeight: 1000000, price: 7000 },
  { region: 'midwest', deadLine: 10, maxWeight: 1000000, price: 6000 },
  { region: 'southeast', deadLine: 10, maxWeight: 1000000, price: 4000 },
  { region: 'south', deadLine: 10, maxWeight: 1000000, price: 5000 },
];

// Remove old values.
log.info('Removing product makers.');
ShippingPrice.collection.deleteMany({}, err=>{
  if (err) {
    log.error(err.stack);
    // Close mongoose. 
    mongoose.close(()=>{
      process.exit();
    });
  } else{
    log.info('Inserting shipiping prices...');
    ShippingPrice.collection.insertMany(prices, (err, res)=>{
      if (err) {
        log.error(err.stack);
      } else{
        log.info('Shipping prices inserted on db.');
      }
      // Close mongoose. 
      mongoose.close(()=>{
        process.exit();
      });
    });
  }
});
