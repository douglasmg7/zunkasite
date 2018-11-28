'use strict';
const mongoose = require('mongoose');

// Banner item.
let bannerItem = new mongoose.Schema({
  fileName: { type: String, required: true },
  link: { type: String, required: true },
});

// Banners.
let banner = new mongoose.Schema({
  items: [bannerItem]
},
{
  timestamps: true
});



module.exports = mongoose.model('banner', banner, 'banners');