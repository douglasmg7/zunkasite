#!/usr/bin/env node
/* eslint-env mocha */
'use strict';
process.env.NODE_ENV = 'test';

// Npm modules.
const expect = require('chai').expect;
const mongo = require('mongodb').MongoClient;
// personal modules
const productsAllNations = require('./allNationsProducts.json');
const productsStore = require('./storeProducts.json');
const dbConfig = require('../bin/dbConfig');
// Module to test.
const AllNations = require('../bin/updateDbWithAllNationsProducts');

// Db connection used into the test.
let dbTest = null;
// All Nations products to be commercialized.
let productsANC = null;

// Initialize All Nations collections.
function initAllNationsCollection(db, callback){
  let col = db.collection(dbConfig.collAllNationProducts);
  // Drop table.
  col.drop(()=>{
    // Assert table was dropped.
    col.find().toArray((err, r)=>{
      expect(r.length).to.equal(0);
      // Insert All Nations products.
      col.insertMany(productsAllNations, (err, r)=>{
        expect(err).to.equal(null);
        expect(r.insertedCount).to.equal(productsAllNations.length);
        callback();
      });
    });
  });
}

// Initialize store collections.
function initStoreCollection(db, callback){
  let col = db.collection(dbConfig.collStoreProducts);
  // Drop table.
  col.drop(()=>{
    // Assert table was dropped.
    col.find().toArray((err, r)=>{
      expect(r.length).to.equal(0);
      // Insert store products.
      col.insertMany(productsStore, (err, r)=>{
        expect(err).to.equal(null);
        expect(r.insertedCount).to.equal(productsStore.length);
        callback();
      });
    });
  });
}

describe('Store products', function(){
  before((done)=>{
    // Pupulate db.
    // Convert timestamp string to date.
    for (let val of productsAllNations){
      val.ts = new Date(val.ts);
    }
    for (let val of productsStore){
      val.storeProductLastUpdate = new Date(val.storeProductLastUpdate);
      val.dealerProductLastUpdate = new Date(val.dealerProductLastUpdate);
    }
    // Connect to db.
    mongo.connect(dbConfig.urlTest, (err, db)=>{
      expect(err).to.equal(null);
      initAllNationsCollection(db, ()=>{
        initStoreCollection(db,()=>{
          db.close();
          done();
        });
      });
    });
  });

  it('connect to db', function(done){
    AllNations.connectDb(dbConfig.urlTest, db=>{
      expect(db.databaseName).to.equal(dbConfig.dbNameTest);
      dbTest = db;
      done();
    });
  });

  it('get products to be commercialized from All Nations collection', done=>{
    AllNations.findProductsAllNations(dbTest, products=>{
      expect(products).to.have.lengthOf(5);
      // Sort by idStore;
      products.sort((a, b)=>{
        return b.storeProductId < a.storeProductId ? 1: -1;
      });
      // storeProductId from db.
      let ptoductIdTest = [
        'flt-hrd',
        'flt-hrd',
        'key-hrd',
        'mouse-hrd',
        'pen-drive-hrd'
      ];
      for (let i = 0; i < products.length; i++) {
        expect(products[i].storeProductId).to.have.string(ptoductIdTest[i]);
      }
      // To be used into the next test.
      productsANC = products;
      done();
    });
  });

  it('insert\/update products into store collection', done=>{
    AllNations.insertProductsStore(dbTest, productsANC, ()=>{
      let col = dbTest.collection(dbConfig.collStoreProducts);
      col.find().toArray((err, products)=>{
        // Number of products that alredy exist and will not be updated or inserted.
        let existProduct = 1;
        // Verify data modifications.
        expect(products).to.be.lengthOf(productsANC.length + existProduct, 'Not all products inserted into store database');
        // Product 1 - just update.
        let flt = products.find(product => product.dealerProductId==='0046860');
        expect(flt).to.be.a('object');
        expect(flt.storeProductId).to.equal('flt-hrd');
        expect(flt.storeProductLastUpdate.toISOString()).to.equal('2016-09-19T13:01:10.000Z');
        expect(flt.storeProductTitle).to.equal('Filtro de linha');
        expect(flt.storeProductMaker).to.equal('Pctop');
        expect(flt.storeProductDescSummary).to.equal('Filtro de linha de 3 tomadas');
        expect(flt.storeProductDescFull).to.equal('<p></p>');
        expect(flt.storeProductTag).to.equal('acessórios');
        expect(flt.storeProductWarrantyPeriodDays).to.equal(180);
        expect(flt.storeProductWarrantyNote).to.equal('Garantia na loja');
        expect(flt.storeProductMarkup).to.equal('20%');
        expect(flt.storeProductRebateValue).to.equal('5%');
        expect(flt.storeProductRebateActive).to.equal(true);
        expect(flt.dealer).to.equal('AllNations');
        expect(flt.dealerProductLastUpdate.toISOString()).to.equal('2016-09-23T12:54:51.000Z'); // updated
        expect(flt.dealerProductTitle).to.equal('FILTRO DE LINHA PCTOP 3 TOMADAS FLP-03');
        expect(flt.dealerProductDesc).to.equal('Filtro de linha PCTOP 3 tomadas (2p+t)\r\nModelo: flp-03\r\n110v / 220v\r\n10a\r\nCabo: 1,5m\r\nChave liga/desliga\r\nFusível protetor'); // updated
        expect(flt.dealerProductWarrantyPeriodDays).to.equal(0);  // updated
        expect(flt.dealerProductPrice).to.equal(8.97);
        expect(flt.dealerProductLocation).to.equal('ES');
        expect(flt.dealerProductWeightG).to.equal(300);
        expect(flt.dealerProductWidthMm).to.equal(100); // updated
        expect(flt.dealerProductHeightMm).to.equal(200);
        expect(flt.dealerProductDeepMm).to.equal(40);
        expect(flt.dealerProductActive).to.equal(1);  // updated
        expect(flt.dealerProductQtd).to.equal(100); // Updated.
        // Product 2 - not changed.
        let lapTop = products.find(product => product.dealerProductId==='0061338');
        expect(lapTop).to.be.a('object');
        expect(lapTop.storeProductId).to.equal('laptop-hrd');
        expect(lapTop.storeProductLastUpdate.toISOString()).to.equal('2016-01-19T13:01:10.000Z');
        expect(lapTop.storeProductTitle).to.equal('Laptop dell 300');
        expect(lapTop.storeProductMaker).to.equal('dell');
        expect(lapTop.storeProductDescSummary).to.equal('Laptop dell duo core');
        expect(lapTop.storeProductDescFull).to.equal('<p><img></img></p>');
        expect(lapTop.storeProductTag).to.equal('laptop');
        expect(lapTop.storeProductWarrantyPeriodDays).to.equal(90);
        expect(lapTop.storeProductWarrantyNote).to.equal('Garantia com o fabricante');
        expect(lapTop.storeProductMarkup).to.equal(19);
        expect(lapTop.storeProductRebateValue).to.equal(4);
        expect(lapTop.storeProductRebateActive).to.equal(false);
        expect(lapTop.dealer).to.equal('AllNations');
        expect(lapTop.dealerProductLastUpdate.toISOString()).to.equal('2016-01-10T13:01:10.000Z');
        expect(lapTop.dealerProductTitle).to.equal('LAPTOP DELL B');
        expect(lapTop.dealerProductDesc).to.equal('no tecnical description');
        expect(lapTop.dealerProductWarrantyPeriodDays).to.equal(91);
        expect(lapTop.dealerProductPrice).to.equal(2114.33);
        expect(lapTop.dealerProductLocation).to.equal('ES');
        expect(lapTop.dealerProductWeightG).to.equal(2400);
        expect(lapTop.dealerProductWidthMm).to.equal(520);
        expect(lapTop.dealerProductHeightMm).to.equal(126);
        expect(lapTop.dealerProductDeepMm).to.equal(360);
        expect(lapTop.dealerProductActive).to.equal(1);
        expect(lapTop.dealerProductQtd).to.equal(33);
        // Product 3 - inserted.
        let flt2 = products.find(product => product.dealerProductId==='0036677');
        expect(flt2).to.be.a('object');
        expect(flt2.storeProductId).to.equal('flt-hrd');
        expect(flt2.storeProductLastUpdate).to.be.an('undefined');
        expect(flt2.storeProductTitle).to.be.an('undefined');
        expect(flt2.storeProductMaker).to.be.an('undefined');
        expect(flt2.storeProductDescSummary).to.be.an('undefined');
        expect(flt2.storeProductDescFull).to.be.an('undefined');
        expect(flt2.storeProductTag).to.be.an('undefined');
        expect(flt2.storeProductWarrantyPeriodDays).to.be.an('undefined');
        expect(flt2.storeProductWarrantyNote).to.be.an('undefined');
        expect(flt2.storeProductMarkup).to.be.an('undefined');
        expect(flt2.storeProductRebateValue).to.be.an('undefined');
        expect(flt2.storeProductRebateActive).to.be.an('undefined');
        expect(flt2.dealer).to.equal('AllNations');
        expect(flt2.dealerProductLastUpdate.toISOString()).to.equal('2016-09-27T20:48:33.000Z');
        expect(flt2.dealerProductTitle).to.equal('FILTRO DE LINHA PCTOP 3 TOMADAS FLP-03');
        expect(flt2.dealerProductDesc).to.equal('Filtro de linha PCTOP 3 tomadas (2p+t)\r\nModelo: flp-03\r\n110v / 220v\r\n10a\r\nCabo: 1,5m\r\nChave liga/desliga\r\nFusível protetor');
        expect(flt2.dealerProductWarrantyPeriodDays).to.equal(6);
        expect(flt2.dealerProductPrice).to.equal(11.31);
        expect(flt2.dealerProductLocation).to.equal('RJ');
        expect(flt2.dealerProductWeightG).to.equal(300);
        expect(flt2.dealerProductWidthMm).to.equal(100);
        expect(flt2.dealerProductHeightMm).to.equal(200);
        expect(flt2.dealerProductDeepMm).to.equal(40);
        expect(flt2.dealerProductActive).to.equal(1);
        expect(flt2.dealerProductQtd).to.equal(95);

        dbTest.close();
        done();
      });
    });
  });

});
