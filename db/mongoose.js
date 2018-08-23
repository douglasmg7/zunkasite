'use strict';
const log = require('../config/log');
const mongoose = require('mongoose');
const dbConfig = require('../config/db');

// Uri.
let uri = null;
process.env.NODE_ENV === 'unitTest' ? uri = dbConfig.urlUnitTest : uri = dbConfig.url;
// Options.
let options = {
  // useMongoClient: true,  // WARNING: The `useMongoClient` option is no longer necessary in mongoose 5.x, please remove it.
  socketTimeoutMS: 0,
  keepAlive: true,
  reconnectTries: 30,
  promiseLibrary: global.Promise  // Set promise for MongoDb Driver.
};
mongoose.Promise = global.Promise;  // Set promise for mongoose uses.
// Mongoose.
log.debug(`uri: ${uri}`);
mongoose.connect(uri, options, function(err){
  if (err) {
    log.error(err.stack);
  }
});
// Error.
mongoose.connection.on('error', function(err){
  log.error(err.stack);
  process.exit(1);
});
// Success.
mongoose.connection.once('open', function() {
  log.info('Connected to Mongoose.');
});
// Disconnected.
mongoose.connection.on('disconnected', function(){
  log.info("Mongoose disconnected.");
});
// Close.
mongoose.connection.once('close', function() {
  log.info('Mongoose closed.');
});

module.exports = mongoose.connection;
