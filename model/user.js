'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

// Schema.
let schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, index: { unique : true}, required: true },
  cellPhone: { type: String },
  password: { type: String, required: true },
  group: { type: Array, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});
// Encrypt password.
schema.methods.encryptPassword = function(password){
  return bcrypt.hashSync(password.trim(), bcrypt.genSaltSync(5), null);
};
// Valid password.
schema.methods.validPassword = function(password){
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', schema);

