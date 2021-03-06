'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

// Schema.
let schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  cpf: { type: String },
  cellPhone: { type: String },
  password: { type: String, required: true },
  group: { type: Array, required: true },
  status: { type: String, required: true },
  removedAt: { type: Date, default: Date.now }
},
{
  timestamps: true
});
// Encrypt password.
schema.methods.encryptPassword = function(password){
  return bcrypt.hashSync(password.trim(), bcrypt.genSaltSync(5), null);
};
// Valid password.
schema.methods.validPassword = function(password){
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('RemovedUser', schema);

