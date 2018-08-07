'use strict';

const redis = require('redis').createClient();
const log = require('../config/log');

redis.on('connect', ()=>{ log.info('Connected to Redis.')});
redis.on('error', err=>{ log.error(err.stack)});

module.exports = redis;