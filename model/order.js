'use strict';
const mongoose = require('mongoose');
// Schema - Address.
let address = new mongoose.Schema({
  name: { type: String, required: true },       // Used by carrier for contact.
  phone: { type: String, required: true },
  cep: { type: String, required: true },
  address: { type: String, required: true },
  addressNumber: { type: String, required: true },
  addressComplement: { type: String, default: '' },
  district: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
});
// Schema.
let schema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, required: true },
  shipAddress: address,
  billAddress: address,
  shipMethod: { type: String },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Order', schema);