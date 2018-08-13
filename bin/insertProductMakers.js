#!/usr/bin/env node
'use strict';
const mongoose = require('../db/mongoose');
const ProductMaker = require('../model/productMaker');
const log = require('../config/log');

const makers = [
  {name: 'Dell', value: 'Dell'},
  {name: 'Intel', value: 'Intel'},
  {name: 'Geforce', value: 'Geforce '},
  {name: 'AMD', value: 'AMD '},
  {name: 'Kingston', value: 'Kingston'},
  {name: 'LG', value: 'LG'},
  {name: 'Asus', value: 'Asus'},
  {name: 'Seagate', value: 'Seagate'},
  {name: 'Western', value: 'Western'},
  {name: 'AOC', value: 'AOC'},
  {name: 'TP-Link', value: 'TP-Link'},
  {name: 'D-link', value: 'D-link'}
];

// Remove old values.
log.info('Removing product makers.');
ProductMaker.collection.deleteMany({}, err=>{
  if (err) {
    log.error(err.stack);
    // Close mongoose. 
    mongoose.close(()=>{
      process.exit();
    });
  } else{
    log.info('Inserting product makers.');
    ProductMaker.collection.insertMany(makers, (err, res)=>{
      if (err) {
        log.error(err.stack);
      } else{
        log.info('Product makers inserted on db, to use into dropdowns.');
      }
      // Close mongoose. 
      mongoose.close(()=>{
        process.exit();
      });
    });
  }
});




