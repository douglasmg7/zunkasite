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
// Schema - Shipping box dimensions.
let boxDimensions = new mongoose.Schema({
  length: { type: Number, required: true },
  height: { type: String, required: true },
  width: { type: String, required: true },
  weight: { type: String, required: true },
  cepOrigin: { type: String, required: true },
  cepDestiny: { type: String, required: true },
});
// Schema - Shipping.
let shipping = new mongoose.Schema({
  box: boxDimensions, // Approximately dimensions for box shipping.
  carrier: { type: String }, // Identify the shipping carrier.
  method: { type: String }, // Identify the shipping method.
  price: { type: String },  // Price for shipment.
  address: address,
  deadline: { type: Number },
  correioResult: correioResult, // Result from correio search ws for shipment price and deadline.
});
// Schema.
let schema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },    // If user change his name, it will keep the name used at order request.
  email: { type: String, required: true },    // If user change his email, it will keep the email used at order request.
  items: [item],   // Itens to be bought.
  shipping: shipping,   // Shipping information.
  // shippingBox: shippingBox, // Approximately dimensions for shipment.
  // shippingCarrier: { type: String }, // Identify the shipping carrier.
  // shippingMethod: { type: String }, // Identify the shipping method.
  // shippingPrice: { type: String },  // Price for shipment.
  // shippingAddress: address,
  // shippingDeadline: { type: Number },
  billAddress: address,
  subtotalPrice: { type: String },  // Items price without shipping price.
  totalPrice: { type: String }, // Items price plus shipping price.
  // correioResult: correioResult, // Result from correio search ws for shipment price and deadline.
  isShippingAddressSelected: { type: Date }, // When the user select the shipping address.
  isShippingMethodSelected: { type: Date }, // When the user select the shipping method.
  isClosed: { type: Date }, // When the user post the order (final process), it goes to closed.
  isPaid: { type: Date },   // When receive payment confirmation.
  isCanceled: { type: Date }, // When the user cancel the order after it was posted (clesed order).
  isShipped: { type: Date },    // Order was shipped.
  isDelivered: { type: Date },  // Receive delivered confirmation.
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Order', schema);