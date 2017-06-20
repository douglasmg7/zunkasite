#!/usr/bin/env node
'use strict';
const expect = require('chai').expect;
const mongo = require('mongodb').MongoClient;
// personal modules
const log = require('./log');
const dbConfig = require('./dbConfig');
log.info('Inserindo lista de produtos na base de dados, para uso em desenvolvimento.');
// Connect to mongo.
mongo.connect(dbConfig.url, (err, db)=>{
  expect(err).to.equal(null);
  const col = db.collection(dbConfig.collStoreProducts);
  // Drop data.
  col.drop(()=>{
    col.find().toArray((err, result)=>{
      expect(err).to.equal(null);
      expect(result.length).to.equal(0);
      // Insert products.
      col.insertMany(categories, (err, result)=>{
        expect(err).to.equal(null);
        expect(result.insertedCount).to.equal(categories.length);
        db.close();
        log.info('Lista de produtos inseridos com sucesso.');
      });
    });
  });
});

const categories = [
  {
    dealer: 'Sul Imports', 
    dealerProductId: '3470239479',
    dealerProductTitle: 'Caixa de som',
    dealerProductActive: true,
    dealerProductLocation: 'RJ',
    dealerProductQtd: 133,
    dealerProductPrice: 150,
    dealerProductWarrantyDays: 30,
    dealerProductCommercialize: true,
    storeProductId: 'cs-908', 
    storeProductTitle: 'Caixa de som - super',     
    storeProductMarkup: 20,
    storeProductDiscountEnable: true,
    storeProductDiscountValue: 5,
    storeProductDiscountType: 1,
    storeProductPrice: 299,
    storeProductDescPrimary: 'Caixa de som 35 Watts',
    storeProductDescComplete: 'Caixa de som com altura de 40cm',
    storeProductMaker: 'Hiptop',
    storeProductCategory: 'Caixas',
    storeProductWarrantyDays: '60',
    storeProductWarrantyDetail: 'Com a loja',
    storeProductCommercialize: true
  },
  {
    dealer: 'Delta Imports', 
    dealerProductId: '34702sdf39479',
    dealerProductTitle: 'Pen drive',
    dealerProductActive: true,
    dealerProductLocation: 'SP',
    dealerProductQtd: 63,
    dealerProductPrice: 14,
    dealerProductWarrantyDays: 7,
    dealerProductCommercialize: true,
    storeProductId: 'pd-99898', 
    storeProductTitle: 'Pendrive - mega',     
    storeProductMarkup: 30,
    storeProductDiscountEnable: true,
    storeProductDiscountValue: 3,
    storeProductDiscountType: 1,
    storeProductPrice: 150,
    storeProductDescPrimary: 'Pendrive 16G',
    storeProductDescComplete: 'Pendrive 16G cor preta',
    storeProductMaker: 'Pmax',
    storeProductCategory: 'Pendrive',
    storeProductWarrantyDays: '12',
    storeProductWarrantyDetail: 'Fornecedor',
    storeProductCommercialize: true
  }
];
