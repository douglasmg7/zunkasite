'use strict';
const mongoose = require('mongoose');
// Schema.
let schema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  number: { type: String, required: true },
  accessKey: { type: String, required: true },
  cnpj: { type: String, required: true },
  issueDate: { type: String, required: true },
  serie: { type: String, required: true },
  url: { type: String, required: true },
},
{
  timestamps: true
});

module.exports = mongoose.model('Invoice', schema);

