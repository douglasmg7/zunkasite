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
	promiseLibrary: global.Promise,  // Set promise for MongoDb Driver.
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
	useFindAndModify: false
};
mongoose.Promise = global.Promise;  // Set promise for mongoose uses.
// Mongoose.
// log.debug(`uri: ${uri}`);
// Error.
mongoose.connection.on('error', function(err){
	log.error(err.stack);
	process.exit(1);
});
// Success.
mongoose.connection.once('open', function() {
	log.info('Connected to Mongoose.');
    // log.info(`mongoose db: ${mongoose.connection.db}`);
    // mongoose.connection.db.collection('products').find({}).toArray((err, docs)=>{
        // log.debug(`docs: ${JSON.stringify(docs.length, null, 2)}`);
    // });
});
// Disconnected.
mongoose.connection.on('disconnected', function(){
	log.info("Mongoose disconnected.");
});
// Close.
mongoose.connection.once('close', function() {
	log.info('Mongoose closed.');
});
// Connect.
mongoose.connect(uri, options, function(err){
    if (err) {
        log.error(err.stack);
    }
});

module.exports = mongoose.connection;
