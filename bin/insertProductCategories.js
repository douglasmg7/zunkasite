#!/usr/bin/env node
'use strict';
const mongoose = require('../db/mongoose');
const ProductCategories = require('../model/productCategorie');
const log = require('../config/log');

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

// Remove old values.
log.info('Removing product categories.');
ProductCategories.collection.deleteMany({}, err=>{
  if (err) {
    log.error(err.stack);
    // Close mongoose. 
    mongoose.close(()=>{
      process.exit();
    });
  } else{
    log.info('Inserting product categories.');
    ProductCategories.collection.insertMany(categories, (err, res)=>{
      if (err) {
        log.error(err.stack);
      } else{
        log.info('Product categories inserted on db, to use into dropdowns.');
      }
      // Close mongoose. 
      mongoose.close(()=>{
        process.exit();
      });
    });
  }
});