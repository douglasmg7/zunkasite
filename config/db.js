'use strict';
const log = require('./log');
const s = require('./s');
// Local development.
// `mongodb://localhost:27017/zunkaTest`,
let host = 'localhost';
let port = '27017';
let name = 'zunka';
let user = '';
let password = '';
let logMsg = 'Using local db.';

// mLab.
if (process.env.DB === 'mlab') {
  // 'mongodb://mammoth:mammuthus@ds159371.mlab.com:59371/mammoth',
  host = s.db.mlab.host;
  port = s.db.mlab.port;
  name = s.db.mlab.name;
  user = s.db.mlab.user;
  password = s.db.mlab.password;
  logMsg = 'Using mLab db.';

// Production.
} else if (process.env.DB === 'production') {
  host = s.db.production.host;
  port = s.db.production.port;
  name = s.db.production.name;
  user = s.db.production.user;
  password = s.db.production.password;
  logMsg = 'Using production db.';
}

// Connection string url - 'mongodb://username:password@host:port/Database'.
let url = `mongodb://${host}:${port}/${name}`;
// Have a user.
if (user) {
  url = `mongodb://${user}:${password}@${host}:${port}/${name}`;
}
// Log which db will be used.
log.info(logMsg);
// Configuration.
const dbConfig = {
  // Uri.
  url: url,
  // For unit test.
  urlUnitTest: 'mongodb://localhost:27017/zunkaTest',
  // All Nations products collections.
  collAllNationProducts: 'allNationsProducts',
  // Manual inserted products.
  collManualProducts: 'manualProducts',
  // Store products collections.
  collStoreProducts: 'products',
  // makers list, use in dropdown
  collProductMakers: 'productMakers',
  // product categories, use in dropdown
  collProductCategories: 'productCategories',
  // User.
  collUser: 'user',
  // sessions
  collSession: 'sessions'
};
module.exports = dbConfig;
