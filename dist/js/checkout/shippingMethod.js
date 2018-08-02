// Vue.
var app = new Vue({
  el: '#app',
  data: {
    order: order
  },
  methods: { 
    shipmentSelected: function(){
      axios({
        method: 'post',
        url: window.location.pathname,
        headers: {'csrf-token' : csrfToken},
        data: { shippingMethod: 'correios'}
      })
      .then(response => {
        // Validation error.
        if (response.data.err) {
          alert('Não foi possível selecionar a forma de envio.');
        } else{
          window.location.href=`/checkout/payment/${this.order._id}`;
        }
      })
      .catch(err => {
        alert('Não foi possível selecionar a forma de envio.');
        console.error(err);
      })  
    }
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