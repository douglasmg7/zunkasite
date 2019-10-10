#!/usr/bin/env node
'use strict';
const mongoose = require('../db/mongoose');
const ShippingPrice = require('../model/shippingPrice');
const log = require('../config/log');

const prices = [
  { region: 'north', deadline: 10, maxWeight: 1234567, price: 567853 },
  { region: 'north', deadline: 10, maxWeight: 3000, price: 10000 },
  { region: 'north', deadline: 5, maxWeight: 100000, price: 10000 },
  { region: 'north', deadline: 5, maxWeight: 3000, price: 10000 },
  { region: 'northeast', deadline: 10, maxWeight: 100000, price: 10000 },
  { region: 'northeast', deadline: 5, maxWeight: 100000, price: 10000 },
  { region: 'midwest', deadline: 10, maxWeight: 100000, price: 10000 },
  { region: 'midwest', deadline: 5, maxWeight: 100000, price: 10000 },
  { region: 'southeast', deadline: 10, maxWeight: 100000, price: 5000 },
  { region: 'southeast', deadline: 5, maxWeight: 100000, price: 7000 },
  { region: 'south', deadline: 10, maxWeight: 100000, price: 7000 },
  { region: 'south', deadline: 5, maxWeight: 100000, price: 9000 },
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
