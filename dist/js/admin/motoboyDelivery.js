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
      this.motoboyDeliveries.push({ city: 'Nova cidade', price: '20,00', deadline: '1', priceValid: true, deadlineValid: true });  
    },
    // Delete motoboy delivery.
    deleteMotoboyDelivery(index){
      this.$delete(this.motoboyDeliveries, index);
    },
    // Save motoboy delivery.
    saveMotoboyDelivery(){
      // Exit if not valid price.
      for (let i = 0; i < motoboyDeliveries.length; i++) {
        if (!motoboyDeliveries[i].priceValid) {
          alert('Preço(s) inválidos.');
          return;
        } else {
          // Format decimal part.
          motoboyDeliveries[i].price = parseFloat(motoboyDeliveries[i].price.replace('.', '').replace(',', '.')).toFixed(2).replace('.', ',');
        }
      }
      // Save data.
      axios({
        method: 'post',
        url: '/admin/motoboy-delivery',
        headers:{'csrf-token' : csrfToken},
        data: { motoboyDeliveries: motoboyDeliveries }
      })
      .then(response => {
        // Server side error.
        if (response.data.err || !response.data.success) {
          alert('Não foi possível salvar.');
        } 
      })
      .catch(err => {
        alert('Não foi possível salvar.');
        console.error(err);
      });       
    },
    validatePrice(index){
      // Valid.
      if (motoboyDeliveries[index].price.match(/^(\d+)(\.\d{3})*(\,\d{0,2})?$/)) {
        motoboyDeliveries[index].priceValid = true;
      // Invalid.
      } else {
        motoboyDeliveries[index].priceValid = false;
      }
    },
    validateDeadline(index){
      // Valid.
      if (motoboyDeliveries[index].deadline.match(/^\d+$/)) {
        motoboyDeliveries[index].deadlineValid = true;
      // Invalid.
      } else {
        motoboyDeliveries[index].deadlineValid = false;
      }
    }    
  }
});
