'use strict';
const log = require('../config/log');
const mongoose = require('mongoose');
const Product = require('./product');

// Cart.
module.exports = function Cart(cart) {
  if (cart) {
    this.totalQtd = cart.totalQtd;
    this.totalPrice = cart.totalPrice;
    this.products = cart.products;
    this.removedProducts = cart.removedProducts;
  } 
  else {
    this.totalQtd = 0;
    this.totalPrice = 0;
    this.products = [];
    this.removedProducts = [];
  }
  this.changed = false;  

  // Add product from db not from other cart.
  this.addProduct = function(product, cb){
    let prodctFound = false;
    for (let i = 0; i < this.products.length; i++) {
      // Product alredy in the cart.
      if (this.products[i]._id == product._id){
        // Add quantity.
        this.products[i].qtd++;
        // // Update price.
        // this.products[i].price = product.storeProductPrice;
        prodctFound = true;
        break;
      }        
    }
    // Product not in the cart, add it.
    if (!prodctFound) {
      this.products.push({
        _id: product._id, 
        qtd: 1, 
        oldQtd: 1, 
        showMsgQtdChanged: false, 
        title: product.storeProductTitle, 
        price: product.storeProductPrice, 
        oldPrice: product.storeProductPrice, 
        showMsgPriceChanged: false, 
        image: product.images[0],
        // Dimensions.
        length: product.storeProductLength,
        height: product.storeProductHeight,
        width: product.storeProductWidth,
        weight: product.storeProductWeight
      });
    }
    // Re-caluculate total quantity and price.
    this.update(cb);
  }

  // Change product quantity from cart.
  this.changeProductQtd = function(productId, qtd, cb){
    for (let i = 0; i  < this.products.length; i++) {
      if (this.products[i]._id === productId) {
        this.products[i].qtd = parseInt(qtd, 10);
        // Verifiy stock.
        Product.findById(this.products[i]._id, (err, product)=>{
          if (err) {
            return cb(err);
          }
          // Out of stock.
          if (product.storeProductQtd <= 0) {
            this.removeProduct.push(this.products[i]);
            this.products[i].splice(i, 1);
            this.products[i].showMsgQtdChanged = true;
          }
          // Stock less than required quatity. 
          else if (this.products[i].qtd > product.storeProductQtd) {
            this.products[i].oldQtd = this.products[i].qtd;
            this.products[i].qtd = product.storeProductQtd;
            this.products[i].showMsgQtdChanged = true;
          }
          // Re-caluculate total quantity and price.
          return this.update(cb);  
        })
      }
    }
  }

  // Remove product from cart.
  this.removeProduct = function(productId, cb){
    for (var i = 0; i  < this.products.length; i++) {
      if (this.products[i]._id === productId) {
        this.products.splice(i, 1);
        break;
      }
    }
    // Re-caluculate total quantity and price.
    this.update(cb);
  }

  // Clean cart.
  this.clean = function(){
    this.products = [];
    this.update();
  }

  // Merge cart .
  this.mergeCart = function(cart, cb){
    if (cart) {
      for (let i = 0; i < cart.products.length; i++) {
        let newProduct = cart.products[i];
        let prodctFound = false;
        for (let j = 0; j < this.products.length; j++) {
          // Product alredy in the cart.
          if (this.products[j]._id == newProduct._id){
            // Not add quantity, user problably added for second time because wasn't logged.
            // // Add quantity.
            // this.products[j].qtd++;
            prodctFound = true;
            break;
          }        
        }
        // Product not in the cart, add it.
        if (!prodctFound) {
          this.products.push(newProduct);
        }
      }
    }
    this.update(cb);
  }

  // Update cart with new prices and stock.
  this.update = function(cb){
    let productsId = [];
    // Get all products on cart.
    for (let i = 0; i < this.products.length; i++) {
      productsId.push(mongoose.Types.ObjectId(this.products[i]._id));
    }
    // Get all products into cart from db.
    Product.find({'_id': { $in: productsId }}, (err, dbProducts)=>{
      if (err) {
        return cb(err);
      }
      // Map to product object to id.
      let productsDbMap = new Map();
      for (let i = 0; i < dbProducts.length; i++) {
        productsDbMap.set(dbProducts[i]._id.toString(), dbProducts[i]);
      }
      // Verify itens with diferent price and out of stock.
      for (let i = 0; i < this.products.length; i++) {
        let dbProduct = productsDbMap.get(this.products[i]._id.toString());
        // Out of stock.
        if (dbProduct.storeProductQtd <= 0) {
          this.removedProducts.push(this.products[i]);
          this.products.splice(i, 1);
          i--;
          continue;
        }
        // Stock less than required quatity. 
        else if (this.products[i].qtd > dbProduct.storeProductQtd) {
          // Price alredy changed.
          if (this.products[i].showMsgQtdChanged) {
            this.products[i].oldQtd = this.products[i].qtd;
            this.products[i].qtd = dbProduct.storeProductQtd;
            this.products[i].showMsgQtdChanged = true;
          }
          // Price change once.
          else {
            this.products[i].qtd = dbProduct.storeProductQtd;
          }
        }
        // Different prices.
        if (this.products[i].price !== dbProduct.storeProductPrice) {
          // Price changed again and user not receive the message yet.
          if (this.products[i].showMsgPriceChanged) {
            this.products[i].price = dbProduct.storeProductPrice;
          // Price changed once.
          } else {
            this.products[i].oldPrice = this.products[i].price;
            this.products[i].price = dbProduct.storeProductPrice;
            this.products[i].showMsgPriceChanged = true;
          }
        }
      }
      // Calculate products total quantity and price.
      this.totalQtd = 0;
      this.totalPrice = 0;
      let that = this;
      this.products.forEach(function(product) {
        that.totalQtd += product.qtd;
        that.totalPrice += (product.price * product.qtd);
      });
      this.changed = true;
      if (cb) {
        cb();
      }  
    });
  },

  // Clean messages shown to client and removed products.
  this.cleanAlertMsg = function(cb){
    this.removedProducts = [];
    for (var i = 0; i < this.products.length; i++) {
      this.products[i].showMsgPriceChanged = false;
      this.products[i].showMsgQtdChanged = false;
    }
    this.update(cb);
  }
}
