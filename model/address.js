'use strict';
const mongoose = require('mongoose');
// Schema.
let schema = new mongoose.Schema({
  cep: { type: String, required: true },
  address: { type: String, required: true },
  addressNumber: { type: String, required: true },
  addressComplement: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  ModifiedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Address', schema);

