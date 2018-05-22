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
    }
  }
});