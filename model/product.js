'use strict';
const mongoose = require('mongoose');

// Product.
let product = new mongoose.Schema({
  // Dealer.
  dealerName: { type: String },   // Dealer name.
  dealerProductId: { type: String },
  dealerProductTitle: { type: String },
  dealerProductLastUpdate: { type: Date },
  dealerProductDesc: { type: String },
  dealerProductWarrantyDays: { type: Number },    // Warrant in days.
  dealerProductLocation: { type: String },  // Product location (ES, MG, RJ, etc...)
  dealerProductDeep: { type: Number },    // Deep (comprimento) in cm.
  dealerProductHeight: { type: Number },  // Height in cm.
  dealerProductWidth: { type: Number },   // Width in cm.
  dealerProductWeight: { type: Number },   // Weight in grams.
  dealerProductActive: { type: Boolean },
  dealerProductCommercialize: { type: Boolean },
  dealerProductPrice: { type: Number },
  // Store.
  storeProductId: { type: String },
  storeProductTitle: { type: String },
  storeProductActive: { type: Boolean },
  storeProductCommercialize: { type: Boolean },
  storeProductDetail: { type: String },
  storeProductDescription: { type: String },
  storeProductTechnicalInformation: { type: String },
  storeProductAdditionalInformation: { type: String },
  storeProductMaker: { type: String },
  storeProductCategory: { type: String },
  storeProductWarrantyDays: { type: Number},  // Warrant in days.
  storeProductWarrantyDetail: { type: String},
  sotreProductLocation: { type: String },  // Product location (ES, MG, RJ, etc...)
  storeProductLength: { type: Number, required: true },    // Length in cm.  
  storeProductHeight: { type: Number, required: true },  // Height in cm.
  storeProductWidth: { type: Number, required: true },   // Width in cm.
  storeProductWeight: { type: Number, required: true },   // Weight in grams.
  storeProductPrice: { type: Number },
  storeProductMarkup: { type: Number },
  storeProductDiscountEnable: { type: Boolean },
  storeProductDiscountType: { type: String },
  storeProductDiscountValue: { type: Number },
  storeProductQtd: { type: Number, required: true},
  storeProductQtdSold: { type: Number, default: 0 },   // To filter by best selling products.
  images: [String]
},
{
  timestamps: true
});

product.pre('findOneAndUpdate', function(next){
  // console.log(`findOneAndUpdate - this: ${Object.keys(this)}`);
  // The first letter of tittle must be upper case, to sort correctly.
  if (this._update) {
    this._update.storeProductTitle = this._update.storeProductTitle.charAt(0).toUpperCase() + this._update.storeProductTitle.slice(1);
  }
  next();
});

// The first letter of tittle must be upper case, to sort correctly.
product.pre('save', function(next){
  // // The first letter of tittle must be upper case, to sort correctly.
  if (this.storeProductTitle) {
    this.storeProductTitle = this.storeProductTitle.charAt(0).toUpperCase() + this.storeProductTitle.slice(1);
  }
  next();
});

module.exports = mongoose.model('product', product, 'products');