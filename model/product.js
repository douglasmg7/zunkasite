'use strict';
const mongoose = require('mongoose');
const log = require('../config/log');
const productCategories = require('../util/productCategories');
const { exec } = require('child_process');

// Time to update zoom xml list.
var zoomwscTimeout;

// Product.
let product = new mongoose.Schema({
	// Dealer.
	dealerName: { type: String },   // Dealer name.
	dealerProductId: { type: String },
	dealerProductTitle: { type: String },
	dealerProductLastUpdate: { type: Date },
	dealerProductDesc: { type: String },
	dealerProductWarrantyDays: { type: Number },    // Warrant in days.
	dealerProductLocation: { type: String, default: '' },  // Product location (ES, MG, RJ, etc...)
	dealerProductDeep: { type: Number },    // Deep (comprimento) in cm.
	dealerProductHeight: { type: Number },  // Height in cm.
	dealerProductWidth: { type: Number },   // Width in cm.
	dealerProductWeight: { type: Number },   // Weight in grams.
	dealerProductActive: { type: Boolean },
	dealerProductCommercialize: { type: Boolean },
	dealerProductPrice: { type: Number },
	// New items. todo - test. 
	dealerProductMaker: { type: String },
	dealerProductCategory: { type: String },

	// Store.
	storeProductId: { type: String },
	storeProductTitle: { type: String },
	storeProductActive: { type: Boolean },
	storeProductCommercialize: { type: Boolean },
	storeProductInfoMD: { type: String },
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
	images: [String],
    // Deprecatade - begin.
    includeWarrantyText: { type: Boolean, default: false },
    // Deprecatade - end.
    includeOutletText: { type: Boolean, default: false },
    warrantyMarkdownName: { type: String },
    displayPriority: { type: Number, default: 100 },
    // The International Article Number (also known as European Article Number or EAN) is a standard describing a barcode symbology and numbering system used in global trade to identify a specific retail product type, in a specific packaging configuration, from a specific manufacturer.
    ean: { type: String, match: /^\d{13}$/ },
	deletedAt: { type: Date }, // When the product was deleted.
    marketZoom: { type: Boolean, default: false },  // If to be market in the zoom market place.
},
{
	timestamps: true
});

// NOT WORKING - MAYBE NEED DELETE DB AND CREATE AGAING.
// No same id for the same dealer.
// product.index({ dealerName: 1, dealerProductId: 1 }, { unique: true });

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

// When a new product was created.
// save - when a new product was created.
// findOneAndUpdate - when a product was saved.
// findOneAndRemove - when a product was removed (fired by findByIdAndRemove too).
// updateOne - when a product quantity was changed.
// product.post(['save', 'findOneAndUpdate', 'findOneAndRemove','updateOne'], function () {
product.post(['save', 'findOneAndUpdate', 'updateOne'], function () {
    productListChanged();
});

// Is called every time list of products change (insert, update and delete).
function productListChanged(){
    // Update categories in use.
    productCategories.updateInUse();

    // Uncomment to enable zoom xml creation - start.
    // // Update zoom products list after some time, stop current time.
    // if (zoomwscTimeout) {
        // clearTimeout(zoomwscTimeout);
    // }
    // // Call zoomwsc (10 min)
    // // zoomwscTimeout = setTimeout(callZoomwsc, 10 * 60 * 1000);
    // // Call zoomwsc (1 second) - for test.
    // zoomwscTimeout = setTimeout(callZoomwsc, 1000);
    // Uncomment to enable zoom xml creation - end.
}

// Call zoomwsc to upate zoom xml product list.
function callZoomwsc() {
    log.debug(`zoomwsc was called...`);
    exec('zoomwsc', (err, stdout, stderr) => {
          if (err) {
              log.error(`Calling zoomwsc. ${err}`);
          }
          // log.debug(`stdout: ${stdout}`);
          // log.debug(`stderr: ${stderr}`);
    })
};

module.exports = mongoose.model('product', product, 'products');