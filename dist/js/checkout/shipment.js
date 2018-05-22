const STANDARD_DELIVERY_DEADLINE = 10;
const STANDARD_DELIVERY_PRICE = '30,00';
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    order: order
  },
  methods: { 
  },
  computed: {
    // a computed getter
    shipmentOption: function () {
      // Correio response.
      if (this.order.correioResult) {
        return `Envio padrão - Prazo de entrega: ${this.order.correioResult.PrazoEntrega} dia(s) - Valor: R$${this.order.correioResult.Valor}`;
      } 
      // No Correio response.
      else {
        return `Envio padrão - Prazo de entrega: 5 dia(s) - Valor: R$30,00`;
      }
    },
    deliveryDeadline: function(){
      if (order.correioResult.PrazoEntrega) {
        return order.correioResult.PrazoEntrega;
      } 
      else {
        return STANDARD_DELIVERY_DEADLINE;
      }
    },
    deliveryPrice: function(){
      if (order.correioResult.Valor) {
        return order.correioResult.Valor;
      } 
      else {
        return STANDARD_DELIVERY_PRICE;
      }
    }
  },
  filters: {
    formatMoney: function(val){
      return 'R$ ' + val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  }
});