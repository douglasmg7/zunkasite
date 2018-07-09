'use strict';
const mongoose = require('mongoose');
// Schema.
let schema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  default: { type: Boolean, default: false },   // Used as default address.
  name: { type: String, default: '', required: true },       // Used by carrier for contact.
  phone: { type: String, default: '', required: true },
  cep: { type: String, default: '', required: true },
  address: { type: String, default: '', required: true },
  addressNumber: { type: String, default: '', required: true },
  addressComplement: { type: String, default: '' },
  district: { type: String, default: '', required: true },
  city: { type: String, default: '', required: true },
  state: { type: String, default: '', required: true },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Address', schema);

