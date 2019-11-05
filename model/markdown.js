'use strict';
const mongoose = require('mongoose');
// Schema.
let schema = new mongoose.Schema({
  name: { type: String, required: true },
  markdown: { type: String, required: true },
},
{
  timestamps: true
});

module.exports = mongoose.model('Markdown', schema);
