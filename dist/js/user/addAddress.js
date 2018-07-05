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
    // CEP not found.
    cepNotFound: false,
    // Loading cep information.
    loadingCepInfo: false,
    // Name.
    name: '',
    // CEP.
    cep: '',
    // Adddress.
    address: '',
    // Number.
    addressNumber: '',
    // Complement.
    addressComplement: '',
    // District.
    district: '',
    // City.
    city: '',
    // State.
    state: '',
    // Phone.
    phone: ''
  },
  methods: {
    // Set default address.
    saveAddress(addressId){
      // Verify CEP.
      if (!this.cep.match(/^\d{5}\D?\d{3}$/)) {
        this.warnMessage = 'CEP inválido.'
        console.log('cep invalido.');
        return;
      }
      // Format CEP.
      // Remove no digits.
      this.cep = this.cep.replace(/\D/g, '');
      // Format 00000-000
      this.cep = this.cep.match(/^\d{5}/)[0] + '-' + this.cep.match(/\d{3}$/)[0];
      axios({
        method: 'post',
        url: `/user/address/add`,
        headers: {'csrf-token' : csrfToken},
        data: { 
          name: this.name, 
          cep: this.cep, 
          address: this.address, 
          addressNumber: this.addressNumber, 
          addressComplement: this.addressComplement, 
          district: this.district,
          city: this.city,
          state: this.state,
          phone: this.phone 
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
    cep: function(val) {
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
            this.address = '';            
            this.district = '';
            this.city = '';
            this.state = '';
          }
          // Found CEP.
          else {
            this.cepNotFound = false;
            this.address = res.data.logradouro;   
            this.district = res.data.bairro;
            this.city = res.data.localidade;
            this.state = res.data.uf;
          }
        })
        .catch((err)=>{
          console.error(`Error - watch - cep, err: ${err}`);
        });        
      }
    }
  } 
});