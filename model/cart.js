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

  // Re-caluculate total quantity and price.
  this.update = function(cb){
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
  }  

  // Add product from db not from other cart.
  this.addProduct = function(product){
    let prodctFound = false;
    for (var i = 0; i < this.products.length; i++) {
      // Product alredy in the cart.
      if (this.products[i]._id == product._id){
        // Add quantity.
        this.products[i].qtd++;
        // Update price.
        this.products[i].price = product.storeProductPrice;
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
    this.update();
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
          if (product.dealerProductQtd <= 0) {
            this.removeProduct.push(this.products[i]);
            this.products[i].splice(i, 1);
            this.products[i].showMsgQtdChanged = true;
            // decrement i.
          }
          // Stock less than required quatity. 
          else if (this.products[i].qtd > product.dealerProductQtd) {
            this.products[i].oldQtd = this.products[i].qtd;
            this.products[i].qtd = product.dealerProductQtd;
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
  this.mergeCart = function(cart){
    if (cart) {
      for (let i = 0; i < cart.products.length; i++) {
        let newProduct = cart.products[i];
        let prodctFound = false;
        for (let j = 0; j < this.products.length; j++) {
          // Product alredy in the cart.
          if (this.products[j]._id == newProduct._id){
            // Add quantity.
            this.products[j].qtd++;
            // Update price.
            this.products[j].price = product.storeProductPrice;
            prodctFound = true;
            break;
          }        
        }
        // Product not in the cart, add it.
        if (!prodctFound) {
          this.products.push(newProduct);
        }
      }
    // Re-caluculate total quantity and price.
    this.update();
    }
  }

  // Update cart with new prices and stock.
  this.updateCartPriceAndStock = function(cb){
    let productsId = [];
    // Get all products on cart.
    for (var i = 0; i < this.products.length; i++) {
      productsId.push(mongoose.Types.ObjectId(this.products[i]._id));
    }
    // Get all products into cart from db.
    Product.find({'_id': { $in: productsId }}, (err, products)=>{
      if (err) {
        return cb(err);
      }
      // Map to product object to id.
      let productsDbMap = new Map();
      for (var i = 0; i < products.length; i++) {
        productsDbMap.set(products[i]._id.toString(), products[i]);
      }
      // Verify itens with diferent price and out of stock.
      for (var i = 0; i < this.products.length; i++) {
        let cartProduct = this.products[i];
        let dbProduct = productsDbMap.get(cartProduct._id);
        // Different prices.
        if (cartProduct.price !== dbProduct.storeProductPrice) {
          log.debug(`Cart product: R$${cartProduct.price} and db product: R$${dbProduct.storeProductPrice} have different prices.`);
          // Price changed again and user not receive the message yet.
          if (cartProduct.showMsgPriceChanged) {
            cartProduct.price = dbProduct.storeProductPrice;
          // Price changed once.
          } else {
            cartProduct.oldPrice = cartProduct.price;
            cartProduct.price = dbProduct.storeProductPrice;
            cartProduct.showMsgPriceChanged = true;
          }
        }
        if (dbProduct.dealerProductQtd < cartProduct.qtd) {
          log.debug(`Product db: ${dbProduct._id} out of stock.`);
        }
      }
      this.update(cb);
    });
  }
}
