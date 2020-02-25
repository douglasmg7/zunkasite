'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Name used for each correio code.
const CORREIOS_SERVICE_NAME = {
    41106: "PAC",
    40215: "Sedex 10",
    40010: "Sedex"
};

// Vue.
var app = new Vue({
    el: '#app',
    data: {
        order: order,
        shippingMethod: '',
        loading: {
            show: false,
            message: 'Verificando a disponibilidade dos produtos ',
        },
    },
    methods: { 
        shipmentSelected: function(){
            if (!this.shippingMethod) {
                alert('Nenuma opção de envio selecionada');
                return;
            }
            this.loading.show = true;
            axios({
                method: 'post',
                url: window.location.pathname,
                headers: {'csrf-token' : csrfToken},
                data: {shippingMethod: this.shippingMethod}
            })
            .then(response => {
                // Validation error.
                if (response.data.err) {
                    window.location.href=`/error?err=${response.data.err}`;
                }
                if (response.data.success) {
                    window.location.href=`/checkout/payment/order/${this.order._id}`;
                } else {
                    this.loading.show = false;
                    // Give time to hide modal-loading.
                    setTimeout(()=>{
                        alert(response.data.message);
                        window.location.href=`/cart`;
                    }, 300);
                }
            })
            .catch(err => {
                window.location.href=`/error?err=${err}`;
            });  
        },
    },
        deliveryDeadline: function(index){
            if (order.shipping.correioResults.length) {
                // console.log("Index: " + index);
                // console.log("Quantity: " + order.shipping.correioResults.length);
                // console.log("PrazoEntrega: " + order.shipping.correioResults[index].PrazoEntrega);
                return order.shipping.correioResults[index].PrazoEntrega;
            } 
            else {
                return order.shipping.deadline;
            }
        },
});
