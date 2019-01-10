#!/usr/bin/env node
'use strict';
const log = require('../config/log');
const redis = require('../db/redis');

redis.keys('motoboy*' (err, result)=>{
  if (err) {
    log.error('Error Inserting motoboy data.');
    log.error(err);
  } else {
    log.info(result)
  }
  redis.quit(()=>{});
});


// log.info('Inserting motoboy data.')
// redis.mset(
//   'motoboy_mg_belo-horizonte', JSON.stringify({price: '20,31', deadline: '12'}), 
//   'motoboy_mg_sabara', JSON.stringify({price: '14,32', deadline: '5'}),
//   (err)=>{
//     if (err) {
//       log.error('Error Inserting motoboy data.');
//       log.error(err);
//     } else {
//       log.info('Motoboy data inserted.')
//     }
//     redis.quit(()=>{});
//   }
// );   




