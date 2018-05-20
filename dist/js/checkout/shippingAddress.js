// Vue.
var app = new Vue({
  el: '#app',
  data: {
    addresss: addresss,
    newAddress: newAddress,
    validation: {},
    loadingCep: false,
    cepFound: false,
    cepErr: false 
  },
  methods: {
    // Select an address.
    selectAddress(address_id){
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
          window.location.href='/checkout/shipment';
        }
      })
      .catch(err => {
        alert('Não foi possível selecionar o endereço');
        console.error(err);
      })       
    },
    // Create new address selected.
    newAddressSelected(){
      axios({
        method: 'post',
        url: window.location.pathname,
        headers:{'csrf-token' : csrfToken},
        data: { newAddress: newAddress }
      })
      .then(response => {
        // Validation erros.
        if (response.data.validation) {
          let validationErros = response.data.validation;
          // Clean validation erros.
          for (let key in this.validation){
            Vue.set(this.validation, key, '') 
          }
          // Set new validation erros.
          for (var i = 0; i < validationErros.length; i++) {
            Vue.set(this.validation, validationErros[i].param.split('.')[1], validationErros[i].msg) 
          }          
        }
        // Other errors.
        else if (response.data.err) {
          alert('Não foi possível selecionar o endereço.');
          console.error(`response.data.err: ${response.data.err}`);        
        }
        // Address selected with success.
        else {
          window.location.href='/checkout/shipment';
        }
      })
      .catch(err => {
        alert('Não foi possível selecionar o endereço');
        console.error(err);
      })       
    },    
  }
});