// Vue.
var app = new Vue({
  el: '#app',
  data: {
    order: order
  },
  computed: {
    deliveryDeadline: function(){
      if (order.shipping.correioResult.PrazoEntrega) {
        return order.shipping.correioResult.PrazoEntrega;
      } 
      else {
        return order.shipping.deadline;
      }
    },
    deliveryPrice: function(){
      if (order.shipping.correioResult.Valor) {
        return order.shipping.correioResult.Valor;
      } 
      else {
        return order.shipping.price;
      }
    }
  },
  filters: {
    formatMoney: function(val){
      return 'R$ ' + val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  }  
});

