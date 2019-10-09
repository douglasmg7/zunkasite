'use strict';
const mongoose = require('mongoose');
// Schema.
let schema = new mongoose.Schema({
  region: { type: String, enum: ['north', 'northeast', 'midwest', 'southeast', 'south'] },       // Used by carrier for contact.
  deadline: { type: Number, required: true },
  maxWeight: { type: Number, required: true },
  price: { type: Number, required: true },     // price * 100.
},
{
  timestamps: true
});

module.exports = mongoose.model('ShippingPrice', schema);
