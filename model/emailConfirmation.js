'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
// Schema.
let schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, index: { unique : true}, required: true },
  password: { type: String, required: true },
  token: { type: String},  
  createdAt: { type: Date, expires: '24h', default: Date.now } // 2 horas (2 x 60 x 60 = 7200).
});
// Encrypt password.
schema.methods.encryptPassword = function(password){
  return bcrypt.hashSync(password.trim(), bcrypt.genSaltSync(5), null);
};
// Valid password.
schema.methods.validPassword = function(password){
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('EmailConfirmation', schema);

