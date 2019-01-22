'use strict';

var app = new Vue({
  el: '#app',
  data: {
    motoboyDeliveries: motoboyDeliveries,
    user: user,
    search: '',
  },
  methods: {   
    // Add motoboy delivery.
    addMotoboyDelivery(){
      this.motoboyDeliveries.push({ city: 'Nova cidade', price: '20,00'});  
    },
    // Delete motoboy delivery.
    deleteMotoboyDelivery(index){
      this.$delete(this.motoboyDeliveries, index);
    },
    // Save motoboy delivery.
    saveMotoboyDelivery(){
      let validationOk = true;
      // Validation.
      for (let i = 0; i < motoboyDeliveries.length; i++) {
        if (parseFloat(motoboyDeliveries[i].price) >= 0) {
          console.info('delete validatioin');
          console.info(motoboyDeliveries[i].price);
          delete motoboyDeliveries[i].validation;
        } else {
          motoboyDeliveries[i].validation = 'Valor inválido.';
          validationOk = false;
        }
      }
      // Save data.
      if (validationOk) {
        axios({
          method: 'post',
          url: '/admin/motoboy-delivery',
          headers:{'csrf-token' : csrfToken},
          data: { motoboyDeliveries: motoboyDeliveries }
        })
        .then(response => {
          // Server side error.
          if (response.data.err) {
            alert('Não foi possível salvar.');
          }
        })
        .catch(err => {
          alert('Não foi possível salvar.');
          console.error(err);
        });       
      }
    },
  }
});
