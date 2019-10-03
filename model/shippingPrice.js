'use strict';
const mongoose = require('mongoose');
// Schema.
let schema = new mongoose.Schema({
  uf: { type: String, required: true },       // Used by carrier for contact.
  city: { type: String, default: '', required: true },
  deadLine: { type: Number, required: true },
  maxWeight: { type: Number, required: true },
  price: { type: Number, required: true },     // price * 100.
},
{
  timestamps: true
});

module.exports = mongoose.model('ShippingPrice', schema);
