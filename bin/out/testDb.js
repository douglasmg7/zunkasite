#!/usr/bin/env node
'use strict';
const expect = require('chai').expect;
const mongo = require('mongodb').MongoClient;
// Personal modules.
const log = require('../config/log');
const dbConfig = require('../config/db');
log.info('Connecting to db...');
// Connect to mongo.
mongo.connect(dbConfig.url, (err, db)=>{
  expect(err).to.equal(null);
  log.info('Connected to db.');
  // Get collections names.
  db.listCollections().toArray((err, items)=>{
    // List collection names.
    let names = [];
    for(let i=0; i<items.length; i++){
      names.push(items[i].name);
    }
    log.info(JSON.stringify(names));
    db.close();
  });
});

