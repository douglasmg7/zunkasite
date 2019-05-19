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
    order: order
  },
  methods: {
    correioServiceName(code){
      return CORREIOS_SERVICE_NAME[code];
    }
  },
  filters: {
    formatMoney: function(val){
      return 'R$ ' + val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  }  
});
