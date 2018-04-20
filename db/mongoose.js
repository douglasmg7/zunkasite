'use strict';
const mongoose = require('mongoose');
const dbConfig = require('../config/db');
const log = require('../config/log');

// Uri.
let uri = null;
process.env.NODE_ENV === 'unitTest' ? uri = dbConfig.urlUnitTest : uri = dbConfig.url;
// Options.
let options = {
  useMongoClient: true,
  socketTimeoutMS: 0,
  keepAlive: true,
  reconnectTries: 30,
  promiseLibrary: global.Promise  // Set promise for MongoDb Driver.
};
mongoose.Promise = global.Promise;  // Set promise for mongoose uses.
// Mongoose.
mongoose.connect(uri, options, function(err){
  if (err) {
    log.error('Mongoose connection error.', {err: err});
  }
});
// Error.
mongoose.connection.on('error', function(err){
  log.error('Mongoose connection error.', {err: err});
  process.exit(1);
});
// Success.
mongoose.connection.once('open', function() {
  log.info('Connected to Mongoose.');
});
// Close.
mongoose.connection.once('close', function() {
  log.info('Mongoose connection close.');
});

module.exports = mongoose.connection;