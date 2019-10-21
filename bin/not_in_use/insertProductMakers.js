#!/usr/bin/env node
'use strict';
const mongoose = require('../db/mongoose');
const ProductMaker = require('../model/productMaker');
const log = require('../config/log');

const makers = [
  {name: 'Acer', value: 'Acer'},
  {name: 'AMD', value: 'AMD'},
  {name: 'AOC', value: 'AOC'},
  {name: 'Asus', value: 'Asus'},
  {name: 'D-link', value: 'D-link'},
  {name: 'Dell', value: 'Dell'},
  {name: 'Geforce', value: 'Geforce'},
  {name: 'Intel', value: 'Intel'},
  {name: 'Kingston', value: 'Kingston'},
  {name: 'LG', value: 'LG'},
  {name: 'Seagate', value: 'Seagate'},
  {name: 'TP-Link', value: 'TP-Link'},
  {name: 'Western', value: 'Western'},
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




