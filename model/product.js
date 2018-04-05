'use strict';
const mongoose = require('mongoose');

// Image.
let Image = new mongoose.Schema({
  name: { type: String, required: true },
  selected: { type: Boolean, required: true }
});

// Product.
let product = new mongoose.Schema({
  // Dealer.
  dealer: { type: String },   // Dealer name.
  dealerProductId: { type: String },
  dealerProductTitle: { type: String },
  dealerProductLastUpdate: { type: Date },
  dealerProductDesc: { type: String },
  dealerProductWarrantyDays: { type: Number },    // Warrant in days.
  dealerProductLocation: { type: String },  // Product location (ES, MG, RJ, etc...)
  dealerProductWeightG: { type: Number },   // Weight in grams.
  dealerProductWidthMm: { type: Number },   // Width in mm.
  dealerProductHeightMm: { type: Number },  // Height in mm.
  dealerProductDeepMm: { type: Number },    // Deep in mm.
  dealerProductActive: { type: Boolean },
  dealerProductCommercialize: { type: Boolean },
  dealerProductQtd: { type: Number },
  dealerProductPrice: { type: Number },
  // Store.
  storeProductId: { type: String, index: { unique : true}, required: true },
  storeProductTitle: { type: String , required: true},
  storeProductCommercialize: { type: Boolean , required: true},
  storeProductDetail: { type: String , required: true},
  storeProductDescription: { type: String , required: true},
  storeProductTechnicalInformation: { type: String , required: true},
  storeProductAdditionalInformation: { type: String , required: true},
  storeProductMaker: { type: String , required: true},
  storeProductCategory: { type: String , required: true},
  storeProductWarrantyDays: { type: Number},  // Warrant in days.
  storeProductWarrantyDetail: { type: String},
  storeProductWeightG: { type: Number },   // Weight in grams.
  storeProductWidthMm: { type: Number },   // Width in mm.
  storeProductHeightMm: { type: Number },  // Height in mm.
  storeProductLengthMm: { type: Number },    // Length in mm.  
  storeProductPrice: { type: Number , required: true},
  storeProductMarkup: { type: Number , required: true},
  storeProductDiscountEnable: { type: Boolean , required: true},
  storeProductDiscountType: { type: String , required: true},
  storeProductDiscountValue: { type: Number , required: true},
  removeUploadedImage: { type: Boolean , required: true},
  isNewProduct: { type: Boolean , required: true},
  images: [Image],
  // Default.
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('storeProduct', product, 'storeProducts');