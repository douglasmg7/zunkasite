'use strict';
const mongoose = require('mongoose');

// // Schema - Item.
// let attributes = new mongoose.Schema({
	// id: { type: String, required: true },
	// name: { type: String, required: true },
	// value_type: { type: String, default: '' },
// });

let schema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
	name: { type: String, required: true },    // If user change his name, it will keep the name used at order request.
	attributes: [Object],   // Itens to be bought.
});
module.exports = mongoose.model('MeliCategory', schema);