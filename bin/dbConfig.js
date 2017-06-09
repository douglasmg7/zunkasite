'use strict';

// Local development.
// `mongodb://localhost:27017/zunkaTest`,
let host = 'localhost';
let port = '27017';
let name = 'zunka';
let user = '';
let password = '';

// mLab.
if (process.env.DB === 'mlab') {
  // 'mongodb://mammoth:mammuthus@ds159371.mlab.com:59371/mammoth',
  host = 'ds159371.mlab.com';
  port = '59371';
  name = 'mammoth';
  user = 'mammoth';
  password = 'mammuthus';
// Production.
} else if (process.env.DB === 'production') {
  throw new Error('Production database not defined.');
}

// Connection string url - 'mongodb://username:password@host:port/Database'.
let url = `mongodb://${host}:${port}/${name}`;
// Have a user.
if (user) {
  url = `mongodb://${user}:${password}@${host}:${port}/${name}`;
}
console.log('URL');
console.log(url);
const dbConfig = {
  // Uri.
  url: url,
  // For unit test.
  urlUnitTest: 'mongodb://localhost:27017/zunkaTest',
  // All Nations products collections.
  collAllNationProducts: 'allNationsProducts',
  // Store products collections.
  collStoreProducts: 'storeProducts',
  // makers list, use in dropdown
  collProductMakers: 'productMakers',
  // product categories, use in dropdown
  collProductCategories: 'productCategories',
  // sessions
  collSession: 'sessions'
};
module.exports = dbConfig;
