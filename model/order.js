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
// Schema - Item.
let item = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },       // Used by carrier for contact.
  quantity: { type: Number, required: true },
  price: { type: String, required: true },
  length: { type: Number, required: true },
  height: { type: Number, required: true },
  width: { type: Number, required: true },
  weight: { type: Number, required: true },
});
// Schema - Correio result.
let correioResult = new mongoose.Schema({
  Codigo: { type: Number },
  Valor: { type: String },
  PrazoEntrega: { type: String },
  ValorMaoPropria: { type: String },
  ValorAvisoRecebimento: { type: String },
  ValorValorDeclarado: { type: String },
  EntregaDomiciliar: { type: String },
  EntregaSabado: { type: String },
  Erro: { type: String },
  MsgErro: { type: String },
  ValorSemAdicionais: { type: String },
  obsFim: { type: String },
});
// Schema - Shipment box.
let shipmentBox = new mongoose.Schema({
  length: { type: Number, required: true },
  height: { type: String, required: true },
  width: { type: String, required: true },
  weight: { type: String, required: true },
  cepOrigin: { type: String, required: true },
  cepDestiny: { type: String, required: true },
});
// Schema.
let schema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },    // If user change his name, it will keep the name used at order request.
  email: { type: String, required: true },    // If user change his email, it will keep the email used at order request.
  items: [item],   // Itens to be bought.
  subtotalPrice: { type: String },
  shippingPrice: { type: String },
  totalPrice: { type: String },
  shippingMethod: { type: String },
  deliveryTime: { type: Number },
  shipAddress: address,
  billAddress: address,
  shipmentBox: shipmentBox,
  correioResult: correioResult,
  status: { type: String, required: true},
  orderedAt: { type: Date },    // Order request time.
  canceledAt: { type: Date },   // Paid confirmation time.
  paidAt: { type: Date },   // Paid confirmation time.
  shippedAt: { type: Date },    // Shipped time.
  deliveredAt: { type: Date },    // Delivered time.
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Order', schema);