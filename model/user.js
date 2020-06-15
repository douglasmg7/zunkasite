'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

// Schema.
let schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, index: { unique : true}, required: true },
    cpf: { type: String, default: '' },
    cnpj: { type: String, default: '' },
    stateRegistration: { type: String, default: '' },   // Inscrição estadual - only when using CNPJ.
    contactName: { type: String, default: '' },   // Only when using CNPJ.
    mobileNumber: { type: String, default: '' },
    password: { type: String, required: true },
    group: { type: Array, required: true },
    status: { type: String, required: true }
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

module.exports = mongoose.model('User', schema);

