#!/usr/bin/env node
'use strict';
const expect = require('chai').expect;
const mongo = require('mongodb').MongoClient;
// personal modules
const log = require('./log');
const dbConfig = require('./dbConfig');
log.info('inserido fabricantes dos produtos na base de dados, para uso em dropdowns');
// Connect to mongo.
mongo.connect(dbConfig.url, (err, db)=>{
  expect(err).to.equal(null);
  const col = db.collection(dbConfig.collProductMakers);
  // drop data
  col.drop(()=>{
    col.find().toArray((err, result)=>{
      expect(err).to.equal(null);
      expect(result.length).to.equal(0);
      // insert makers
      col.insertMany(makers, (err, result)=>{
        expect(err).to.equal(null);
        expect(result.insertedCount).to.equal(makers.length);
        db.close();
        log.info('fabricantes dos produtos inseridos com sucesso');
      });
    });
  });
});

const makers = [
  {name: 'Dell', value: 'Dell'},
  {name: 'Intel', value: 'Intel'},
  {name: 'Geforce', value: 'Geforce '},
  {name: 'AMD', value: 'AMD '},
  {name: 'Kingston', value: 'Kingston'},
  {name: 'LG', value: 'LG'},
  {name: 'Asus', value: 'Asus'},
  {name: 'Seagate', value: 'Seagate'},
  {name: 'Western', value: 'Western'},
  {name: 'AOC', value: 'AOC'},
  {name: 'TP-Link', value: 'TP-Link'},
  {name: 'D-link', value: 'D-link'}
];
