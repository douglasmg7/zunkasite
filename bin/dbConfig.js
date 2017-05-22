'use strict';

// Database name.
const DB_NAME = 'hardPlus';
// Database name for test.
const DB_NAME_TEST = DB_NAME + 'Test';

const dbConfig = {
  // Database name.
  dbName: DB_NAME,
  // Database name for test.
  dbNameTest: DB_NAME_TEST,
  // Mongodb connection.
  url: `mongodb://localhost:27017/${DB_NAME}`,
  // Mongodb connections for test.
  urlTest: `mongodb://localhost:27017/${DB_NAME_TEST}`,
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
