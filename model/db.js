'use strict';

const mongo = require('mongodb').MongoClient;
const dbConfig = require('../bin/dbConfig');
const log = require('../bin/log');

let state = {
  db: null,
  config: dbConfig
};

// Define which db to use.
let dbUrl = null;
process.env.NODE_ENV === 'test' ? dbUrl = dbConfig.urlTest : dbUrl = dbConfig.url;

mongo.connect(dbUrl, (err, database)=>{
  if(err){
    log.error('MongoDb connection error.', {err: err});
    process.exit(1);
  } else {
    state.db = database;
    log.info('Connected to mongoDb.');
  }
});

module.exports = state;
