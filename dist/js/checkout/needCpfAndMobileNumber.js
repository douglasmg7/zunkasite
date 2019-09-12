'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // Warn message.
    warnMessage: '',
    // Cpf.
    cpf: cpf,
    // Mobile number.
    mobileNumber: mobileNumber,
    // Order id.
    orderId: orderId
  },
  methods: {
    save(){
      axios({
        method: 'post',
        url: `/checkout/needCpfAndMobileNumber`,
        headers: {'csrf-token' : csrfToken},
        data: { cpf: this.cpf, mobileNumber: this.mobileNumber, orderId: this.orderId }
      })
      .then((res)=>{
        // Successful change the name.
        if (res.data.success) {
          window.location.href = `/checkout/payment/order/${orderId}`;
        }
        // Something wrong.
        else
        {
          this.warnMessage = res.data.message;
        }
      })
      .catch((err)=>{
        console.error(`Error, err: ${err}`);
      });
    }
  },
});
