// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // user.
    user: user,
    // Cart.
    cart: cart,
    // Show modal.
    showModal: false
  },
  created(){
    // If need show msg cart changed by the system.
    this.isServerChangedCart();
  },
  methods: {
    isServerChangedCart(){
      // If need show msg cart changed by the system.
      if (cart.removedProducts.length > 0) {
          return this.showModal = true;
      }
      for (var i = 0; i < cart.products.length; i++) {
        if (cart.products[i].showMsgPriceChanged || cart.products[i].showMsgQtdChanged) {
          return this.showModal = true;
        }
      }
    },
    changeProductQtd(product){
      // console.log(product._id);
      // console.log(product.qtd);
      axios({
        method: 'put',
        url: `cart/change-qtd/${product._id}/${product.qtd}`,
        headers: {'csrf-token' : csrfToken},
      })
      .then((res)=>{
        // Success.
        if (res.data.success) {
          this.cart = res.data.cart;
          // Update nav-bar.
          document.getElementById('cart-qtd').innerHTML = this.cart.totalQtd;
          // Show changed cart itens by server.
          this.isServerChangedCart();
        }
      })
      .catch((err)=>{
        alert('Erro interno, não foi possível atualizar o carrinho.');
        console.error(`Error - changeProductQtd(), err: ${err}`);
      });
    },
    removeProduct(product){
      console.log(product._id);
      console.log(product.qtd);
      axios({
        method: 'put',
        url: `cart/remove/${product._id}`,
        headers: {'csrf-token' : csrfToken},
      })
      .then((res)=>{
        // Success.
        if (res.data.success) {
          this.cart = res.data.cart;      
          // Update nav-bar.
          document.getElementById('cart-qtd').innerHTML = this.cart.totalQtd;    
        }
      })
      .catch((err)=>{
        alert('Erro interno, não foi possível atualizar o carrinho.');
        console.error(`Error - removeProduct(), err: ${err}`);
      });
    },  
    selectAddress(){
      window.location.href = '/checkout/shipping-address';
    },
    // used for test.
    updateStock(){
      axios({
        method: 'post',
        url: '/checkout/update-stock',
        headers: {'csrf-token' : csrfToken},
      })
      .then((res)=>{
        // Success.
        if (res.data.success) {
          this.cart = res.data.cart;          
        }
      })
      .catch((err)=>{
        alert('Erro interno, não foi possível atualizar o carrinho.');
        console.error(`Error - updateStock(), err: ${err}`);
      });
    },  
    // user receive msg that cart was change.
    userReceiveMsgCartChanged(){
      axios({
        method: 'post',
        url: '/cart/clean-alert-msg',
        headers: {'csrf-token' : csrfToken},
      })
      .then((res)=>{
        // Success.
        if (res.data.success) {
          this.cart = res.data.cart;
          this.showModal = false;    
        }
      })
      .catch((err)=>{
        console.error(`Error - userReceiveMsgCartChanged(), err: ${err}`);
      });
    },  
  },
  computed: {
    productsPriceChanged: function(){
      for (var i = 0; i < this.cart.products.length; i++) {
        if (this.cart.products[i].showMsgPriceChanged) {
          return true;
        } 
      }
      return false;
    },
    productsQtdChanged: function(){
      for (var i = 0; i < this.cart.products.length; i++) {
        if (this.cart.products[i].showMsgQtdChanged) {
          return true;
        } 
      }
      return false;
    }
  },
  filters: { 
    currency(val){ return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, "."); },
  },
});
