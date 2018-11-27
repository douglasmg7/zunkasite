'use strict';
const mongoose = require('mongoose');

// Banner item.
let banner = new mongoose.Schema({
  fileName: { type: String, required: true },
  link: { type: String, required: true },
});

// Banners.
let banners = new mongoose.Schema({
  banner: [banner]
},
{
  timestamps: true
});



module.exports = mongoose.model('banners', banners, 'banners');