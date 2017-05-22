#!/usr/bin/env node
'use strict';
const expect = require('chai').expect;
const mongo = require('mongodb').MongoClient;
// personal modules
const log = require('./log');
const dbConfig = require('./dbConfig');
log.info('inserido categoria dos produtos na base de dados, para uso em dropdowns');
// Connect to mongo.
mongo.connect(dbConfig.url, (err, db)=>{
  expect(err).to.equal(null);
  const col = db.collection(dbConfig.collProductCategories);
  // drop data
  col.drop(()=>{
    col.find().toArray((err, result)=>{
      expect(err).to.equal(null);
      expect(result.length).to.equal(0);
      // insert categories
      col.insertMany(categories, (err, result)=>{
        expect(err).to.equal(null);
        expect(result.insertedCount).to.equal(categories.length);
        db.close();
        log.info('categoria dos produtos inseridos com sucesso');
      });
    });
  });
});

const categories = [
  {name: 'Adaptadores', value: 'Adaptadores'},
  {name: 'Cabos', value: 'Cabos'},
  {name: 'Cartões', value: 'Cartões'},
  {name: 'Computadores', value: 'Computadores'},
  {name: 'Coolers', value: 'Coolers'},
  {name: 'Diversos', value: 'Diversos'},
  {name: 'Energia', value: 'Energia'},
  {name: 'Fones de ouvido', value: 'Fones de ouvido'},
  {name: 'Fontes', value: 'Fontes'},
  {name: 'Gabinetes', value: 'Gabinetes'},
  {name: 'Gravadores', value: 'Gravadores'},
  {name: 'HDs', value: 'HDs'},
  {name: 'HDs externos', value: 'HDs externos'},
  {name: 'HDs notebook', value: 'HDs notebook'},
  {name: 'Memorias', value: 'Memorias'},
  {name: 'Memorias notebook', value: 'Memorias notebook'},
  {name: 'Monitores', value: 'Monitores'},
  {name: 'Mouses', value: 'Mouses'},
  {name: 'Notebook Acessórios', value: 'Notebook Acessórios'},
  {name: 'Notebooks', value: 'Notebooks'},
  {name: 'Pen drives', value: 'Pen drives'},
  {name: 'Placas de Video', value: 'Placas de Video'},
  {name: 'Placas mãe', value: 'Placas mãe'},
  {name: 'Processadores', value: 'Processadores'},
  {name: 'Redes', value: 'Redes'},
  {name: 'SSDs', value: 'SSDs'},
  {name: 'Teclados', value: 'Teclados'},
  {name: 'Ventoinhas', value: 'Ventoinhas'},
  {name: 'Webcameras', value: 'Webcameras'}
];
