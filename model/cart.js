'use strict';

// Cart.
module.exports = function Cart(cart) {
  if (cart) {
    this.totalQtd = cart.totalQtd;
    this.totalPrice = cart.totalPrice;
    this.products = cart.products;
  } 
  else {
    this.totalQtd = 0;
    this.totalPrice = 0;
    this.products = [];
  }
  this.changed = false;

  // Re-caluculate total quantity and price.
  this.update = function(){
    // Calculate products total quantity and price.
    this.totalQtd = 0;
    this.totalPrice = 0;
    let that = this;
    this.products.forEach(function(product) {
      that.totalQtd += product.qtd;
      that.totalPrice += (product.price * product.qtd);
    });
    this.changed = true;    
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
      // Find first image selected.
      let image;
      for (let i = 0; i < product.images.length; i++) {
        if (product.images[i].selected) {
          image = product.images[i].name;
          break;
        }
      }
      this.products.push({_id: product._id, qtd: 1, title: product.storeProductTitle, price: product.storeProductPrice, image: image});
    }
    // Re-caluculate total quantity and price.
    this.update();
  }

  // Change product quantity from cart.
  this.changeProductQtd = function(_id, qtd){
    for (var i = 0; i  < this.products.length; i++) {
      if (this.products[i]._id === _id) {
        this.products[i].qtd = parseInt(qtd, 10);
        break;
      }
    }
    // Re-caluculate total quantity and price.
    this.update();  
  }

  // Remove product from cart.
  this.removeProduct = function(_id){
    for (var i = 0; i  < this.products.length; i++) {
      if (this.products[i]._id === _id) {
        this.products.splice(i, 1);
        break;
      }
    }
    // Re-caluculate total quantity and price.
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
}
