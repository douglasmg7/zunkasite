#!/usr/bin/env node
/* eslint-env mocha */
'use strict';
process.env.NODE_ENV = 'test';

const mongo = require('mongodb').MongoClient;
const expect = require('chai').expect;
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

// Store products to populate db test.
const productsStore = require('./storeProducts.json');
// Db configurations.
const dbConfig = require('../bin/dbConfig');

// Server to test.
let server = null;

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

describe('Web service store products', ()=>{

  before((done)=>{
    // Pupulate db.
    // Convert timestamp string to date.
    for (let val of productsStore){
      val.storeProductLastUpdate = new Date(val.storeProductLastUpdate);
      val.dealerProductLastUpdate = new Date(val.dealerProductLastUpdate);
    }
    // Insert store porducts.
    mongo.connect(dbConfig.urlTest, (err, db)=>{
      expect(err).to.equal(null);
      initStoreCollection(db,()=>{
        db.close();
        // Start server.
        let http = require('http');
        let app = require('../app');
        server = http.createServer(app);
        done();
        // server.listen(3001, ()=>{
        //   done();
        // });
      });
    });
  });

  after(()=>{
    // Close server.
    server.close();
  });

  it('get all products', (done)=>{
    chai.request(server)
      .get('/ws/products')
      .end((err, res)=>{
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('array');
        expect(res.body).to.be.lengthOf(2);
        expect(res.body[0].storeProductId).to.equal('flt-hrd');
        expect(res.body[0].storeProductLastUpdate).to.equal('2016-09-19T13:01:10.000Z');
        expect(res.body[0].storeProductTitle).to.equal('Filtro de linha');
        expect(res.body[0].storeProductMaker).to.equal('Pctop');
        expect(res.body[0].storeProductDescSummary).to.equal('Filtro de linha de 3 tomadas');
        expect(res.body[0].storeProductDescFull).to.equal('<p></p>');
        expect(res.body[0].storeProductTag).to.equal('acessórios');
        expect(res.body[0].storeProductWarrantyPeriodDays).to.equal(180);
        expect(res.body[0].storeProductWarrantyNote).to.equal('Garantia na loja');
        expect(res.body[0].storeProductMarkup).to.equal('20%');
        expect(res.body[0].storeProductRebateValue).to.equal('5%');
        expect(res.body[0].storeProductRebateActive).to.be.true;
        expect(res.body[0].dealer).to.equal('AllNations');
        expect(res.body[0].dealerProductId).to.equal('0046860');
        expect(res.body[0].dealerProductLastUpdate).to.equal('2016-08-19T13:01:10.000Z');
        expect(res.body[0].dealerProductTitle).to.equal('FILTRO DE LINHA PCTOP 3 TOMADAS FLP-03');
        expect(res.body[0].dealerProductDesc).to.equal('no tecnical description');
        expect(res.body[0].dealerProductWarrantyPeriodDays).to.equal(180);
        expect(res.body[0].dealerProductPrice).to.equal(7.77);
        expect(res.body[0].dealerProductLocation).to.equal('ES');
        expect(res.body[0].dealerProductWeightG).to.equal(300);
        expect(res.body[0].dealerProductWidthMm).to.equal(40);
        expect(res.body[0].dealerProductHeightMm).to.equal(120);
        expect(res.body[0].dealerProductDeepMm).to.equal(90);
        expect(res.body[0].dealerProductActive).to.equal(0);
        expect(res.body[0].dealerProductQtd).to.equal(49);

        done();
      });
  });

});
