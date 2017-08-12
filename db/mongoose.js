'use strict';
const mongoose = require('mongoose');
const dbConfig = require('../config/db');
const log = require('../config/log');

const state = {
  db: null,
  config: dbConfig
};

// Uri.
let uri = null;
process.env.NODE_ENV === 'unitTest' ? uri = dbConfig.urlUnitTest : uri = dbConfig.url;
// Options.
let options = {
  useMongoClient: true,
  socketTimeoutMS: 0,
  keepAlive: true,
  reconnectTries: 30
};
// Mongoose.
mongoose.connect(uri, options, function(err){
  if (err) {
    log.error('Mongoose connection error.', {err: err});
  }
});
state.db = mongoose.connection;
// Error.
state.db.on('error', function(err){
  log.error('Mongoose connection error.', {err: err});
  process.exit(1);
});
// Success.
state.db.once('open', function() {
  log.info('Connected to Mongoose.');
});

module.exports = state;