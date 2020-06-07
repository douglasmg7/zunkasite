#!/usr/bin/env node
'use strict';
const mongoose = require('../../db/mongoose');
const Product = require('../../model/product');
// const log = require('../../config/log');
console.log('Checking product prices...');

// Order.find({status: {$nin: ["placed", "canceled"]}}).sort({ "timestamps.paidAt": 1 })
Product.find({deletedAt: {$exists: false}})
.then(docs=>{
    docs.forEach(product=>{
        let storeProductPrice = 0;
        let priceWithMarkup = product.dealerProductPrice * (product.storeProductMarkup / 100 + 1)
        if(product.storeProductDiscountEnable){
            // Use percentage.
            if(product.storeProductDiscountType === '%'){
                storeProductPrice = (priceWithMarkup * (1 - (product.storeProductDiscountValue / 100))).toFixed(2);
            }
            // Use monetary value.
            else {
                storeProductPrice = (priceWithMarkup - product.storeProductDiscountValue).toFixed(2);
            }
        }
        // No discount.
        else {
            storeProductPrice = priceWithMarkup.toFixed(2);
        }
        let diff = product.storeProductPrice - storeProductPrice;
        if (diff >= 1) {
            console.log(`${product._id} - diff ${Math.abs(diff).toFixed(4)}, markup: ${product.storeProductMarkup},  discount: ${product.storeProductDiscountEnable}, dealer price: ${product.dealerProductPrice}, store price ${storeProductPrice}`);
        }
    });
    console.log('Checking product prices finished');
    mongoose.close(()=>{
        process.exit();
    });
})
.catch(err=>{
    console.error(err);
});

