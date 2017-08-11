'use strict';
const mongoose = require('mongoose');
const dbConfig = require('../config/db');
const log = require('../config/log');

const state = {
  db: null,
  config: dbConfig
};

// Define which db to use.
let url = null;
process.env.NODE_ENV === 'unitTest' ? url = dbConfig.urlUnitTest : url = dbConfig.url;

// Mongoose.
mongoose.connect(process.env.NODE_ENV === 'unitTest' ? dbConfig.urlUnitTest : dbConfig.url);
state.db = mongoose.connection;
// Error.
state.db.on('error', function(err){
  log.error('MongoDb connection error.', {err: err});
  process.exit(1);
});
// Success.
state.db.once('open', function() {
  log.info('Connected to Mongoose.');
});

module.exports = state;