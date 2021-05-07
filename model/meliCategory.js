'use strict';
const mongoose = require('mongoose');

let schema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
	name: { type: String, required: true },
	zunkaCategory: { type: String, default: '' },
	attributes: [Object],
});
module.exports = mongoose.model('MeliCategory', schema);