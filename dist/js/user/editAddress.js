// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // Warn message.
    warnMessage: '',
    // Is new address.
    isNewAddress: isNewAddress,
    // CEP not found.
    cepNotFound: false,
    // Loading cep information.
    loadingCepInfo: false,
    // Address.
    address: address
  },
  methods: {
    // Set default address.
    saveAddress(addressId){
      // Verify CEP.
      if (!this.address.cep.match(/^\d{5}\D?\d{3}$/)) {
        this.warnMessage = 'CEP inválido.'
        console.log('cep invalido.');
        return;
      }
      // Format CEP.
      // Remove no digits.
      this.address.cep = this.address.cep.replace(/\D/g, '');
      // Format 00000-000
      this.address.cep = this.address.cep.match(/^\d{5}/)[0] + '-' + this.address.cep.match(/\d{3}$/)[0];
      axios({
        method: 'post',
        url: `/user/address/edit`,
        headers: {'csrf-token' : csrfToken},
        data: { 
          address: this.address
        }
      })
      .then((res)=>{
        // Successful set address as default.
        if (res.data.success) {
          window.location.href = '/user/address';
        }
        // Something wrong.
        else
        {
          this.warnMessage = res.data.message;
        }
      })
      .catch((err)=>{
        console.error(`Error - saveAddress(), err: ${err}`);
      });
    }
  },
  watch: {
    'address.cep': function(val) {
      // Cep is valid if 00000-000 or 00000000.
      if (val.match(/^\d{5}-?\d{3}$/)) {
        this.loadingCepInfo = true;
        axios({
          method: 'get',
          url: `https://viacep.com.br/ws/${val}/json/`,
        })
        .then((res)=>{
          this.loadingCepInfo = false;
          // console.log(`res: ${JSON.stringify(res)}`);
          // Not found CEP.
          if (res.data.erro) {
            this.cepNotFound = true;
            this.address.address = '';            
            this.address.district = '';
            this.address.city = '';
            this.address.state = '';
          }
          // Found CEP.
          else {
            this.cepNotFound = false;
            this.address.address = res.data.logradouro;   
            this.address.district = res.data.bairro;
            this.address.city = res.data.localidade;
            this.address.state = res.data.uf;
          }
        })
        .catch((err)=>{
          console.error(`Error - watch - cep, err: ${err}`);
        });        
      }
    }
  } 
});