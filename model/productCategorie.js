'use strict';
const mongoose = require('mongoose');

// Product.
let productCategories = new mongoose.Schema({
  // Name Value pair.
  name: { type: String }, // Name.
  value: { type: String },  // value.
  // Default.
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

// Model name, scheme, mongo table.
module.exports = mongoose.model('productCategorie', productCategories, 'productCategories');