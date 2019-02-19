'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
  el: '#app',
  data: {
    addresss: addresss,
    newAddress: {
      name: '',
      cep: '',
      address: '',
      addressNumber: '',
      addressComplement: '',
      district: '',
      city: '',
      state: '',
      phone: ''
    },
    validation: {
      name: '',
      cep: '',
      address: '',
      addressNumber: '',
      addressComplement: '',
      district: '',
      city: '',
      state: '',
      phone: ''      
    },
    loadingCep: false,
    cepFound: false,
    cepErr: false 
  },
  methods: {
    // Select an address.
    selectAddress(address_id){
          console.log("axio");

      axios({
        method: 'post',
        url: window.location.pathname,
        headers:{'csrf-token' : csrfToken},
        data: { address_id: address_id }
      })
      .then(response => {
        // Validation error.
        if (response.data.err) {
          alert('Não foi possível selecionar o endereço.');
        } else{
          console.log("waiting new location");
          window.location.href=`/checkout/shipping-method/${response.data.order_id}`;
        }
      })
      .catch(err => {
        alert('Não foi possível selecionar o endereço');
        console.error(err);
      });       
    },
    // Create new address selected.
    newAddressSelected(){
      axios({
        method: 'post',
        url: window.location.pathname,
        headers:{'csrf-token' : csrfToken},
        data: { newAddress: this.newAddress }
      })
      .then(response => {
        // Validation erros.
        if (response.data.validation) {
          let validationErros = response.data.validation;
          // Clean validation erros.
          for (let key in this.validation){
            // Vue.set(this.validation, key, ''); 
            this.validation[key] = '';
          }
          // Set new validation erros.
          for (var i = 0; i < validationErros.length; i++) {
            this.validation[validationErros[i].param.split('.')[1]] = validationErros[i].msg;
            // Vue.set(this.validation, validationErros[i].param.split('.')[1], validationErros[i].msg);
          }          
        }
        // Other errors.
        else if (response.data.err) {
          alert('Não foi possível selecionar o endereço.');
          console.error(`response.data.err: ${response.data.err}`);        
        }
        // Address selected with success.
        else {
          window.location.href=`/checkout/shipping-method/${response.data.order_id}`;
        }
      })
      .catch(err => {
        alert('Não foi possível selecionar o endereço');
        console.error(err);
      });       
    },
    // Get CEP information.
    getCepInfo() {
      // Only digits.
      this.newAddress.cep = this.newAddress.cep.replace(/\D/g, '');
      // Correct size.
      if (this.newAddress.cep.length === 8){      
        axios({
          method: 'get',
          url: `https://viacep.com.br/ws/${this.newAddress.cep}/json/`,
        })
        .then(response => {
          // Validation error.
          if (response.data.erro) {
            this.validation.cep = 'CEP inválido.';
          } else{
            this.validation.cep = '';
            // State.
            this.newAddress.state = response.data.uf;
            // City.
            this.newAddress.city = response.data.localidade;
            // District.
            this.newAddress.district = response.data.bairro;
            // Address.
            this.newAddress.address = response.data.logradouro;
          }
        })
        .catch(err => {
          this.validation.cep = 'CEP inválido.';
          console.error(err);
        });  
      } 
      // Wrong size.
      else if(this.newAddress.cep.length > 0) {
        this.validation.cep = 'CEP inválido.';
      }
    }    
  }
});
