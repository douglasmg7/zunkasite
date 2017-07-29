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

  // Add product.
  this.addProduct = function(product){
    let prodctFound = false;
    for (var i = 0; i < this.products.length; i++) {
      // Product alredy in the cart.
      if (products[i]._id == product._id){
        // Add quantity.
        products[i].qtd++;
        // Update price.
        products[i].price = product.storeProductPrice;
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
      products.push({_id: product._id, qtd: 1, title: product.storeProductTitle, price: product.storeProductPrice, image: image});
    }
    // Calculate products total quantity and price.
    user.cart.totalQtd = 0;
    user.cart.totalPrice = 0;
    user.cart.products.forEach(function(product) {
      user.cart.totalQtd += product.qtd;
      user.cart.totalPrice += (product.price * product.qtd);
      // console.log('product: ', product.storeProductTitle);
      // console.log('totalQtd: ', user.cart.totalQtd);
      // console.log('totalPrice: ', user.cart.totalPrice);
    });
  }

  // Merge cart .
  this.mergeCart = function(cart){
    if (cart) {
      for (let i = 0; i < cart.products.length; i++) {
        this.addProduct(cart.products[i]);
      }      
    }
  }  
}
