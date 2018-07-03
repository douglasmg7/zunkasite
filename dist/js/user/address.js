// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // Addresses.
    addresses: addresses,
  },
  methods: {
    // Remove address.
    removeAddress(addressId){
      if (confirm('Confirma a remoção do endereço ?')) {
        axios({
          method: 'post',
          url: `address/remove/${addressId}`,
          headers: {'csrf-token' : csrfToken},
        })
        .then((res)=>{
          // Address removed successful.
          if (res.data.success) {
            // Remove address.
            // todo.
          }
        })
        .catch((err)=>{
          console.error(`Error - removeAddress(), err: ${err}`);
        });
      }
    },
    // Remove address.
    setDefaultAddress(addressId){
      if (confirm('Confirma a remoção do endereço ?')) {
        axios({
          method: 'post',
          url: `address/default/${addressId}`,
          headers: {'csrf-token' : csrfToken},
        })
        .then((res)=>{
          // Successful set address as default.
          if (res.data.success) {
            // Set only this address as default.
            // todo.
          }
        })
        .catch((err)=>{
          console.error(`Error - setDefaultAddress(), err: ${err}`);
        });
      }
    },
    addAddress(addressId){
      // window.location.href = '/user/signup';
    },
    editAddress(addressId){
      window.location.href = `address/edit?addressId=${addressId}`;
    }
  } 
});


  // // Remove address.
  // $('.remove-address').on('click', function(event){
  //   let $target = $(event.target);
  //   let $panel = $target.closest('.z-panel');
  //   let addressId = $panel.data('address-id');
  //   console.log(addressId);
  //   if (confirm('Confirma a remoção do endereço ?')) {
  //     $.ajax({
  //       method: 'PUT',
  //       url: 'address/remove/' + addressId,
  //       data: { _csrf: '#{csrfToken}'}
  //     })
  //     .done(function(result){
  //       // Remove address.
  //       $target.closest('.col-md-4').remove();
  //     });
  //   }
  // });
  // Set address as default.


  // $('.set-default-address').on('click', function(event){
  //   let $target = $(event.target);
  //   let $panel = $target.closest('.z-panel');
  //   let addressId = $panel.data('address-id');
  //   $.ajax({
  //     method: 'PUT',
  //     url: 'address/default/' + addressId,
  //     data: { _csrf: '#{csrfToken}'}
  //   })
  //   .done(function(result){
  //     // Change default adddress.
  //     // Find all address panels.
  //     $('.z-panel').filter('.address').each(function(){
  //       let $this = $(this);
  //       // Set as default.
  //       if($this.data('address-id') === addressId) {
  //         if($this.find('.z-panel-heading').length === 0){
  //           $this.prepend('<div class=z-panel-heading> Padrão </div>');
  //         }
  //       }
  //       // Unset as default. 
  //       else {
  //         $this.find('.z-panel-heading').remove();
  //       }
  //     });
  //   });
  // });  