'use strict';
const mongoose = require('mongoose');
// Schema.
let schema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required:true },
  name: { type: String, required: true },       // Used by carrier for contact.
  default: { type: Boolean, default: false },   // Used as default address.
  phone: { type: String, required: true },
  cep: { type: String, required: true },
  address: { type: String, required: true },
  addressNumber: { type: String, required: true },
  addressComplement: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Address', schema);

