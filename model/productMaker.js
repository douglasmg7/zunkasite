'use strict';
const mongoose = require('mongoose');

// Product.
let productMaker = new mongoose.Schema({
  // Name Value pair.
  name: { type: String },
  value: { type: String },
},
{
  timestamps: true
});

// Model name, scheme, mongo table.
module.exports = mongoose.model('productMaker', productMaker, 'productMakers');