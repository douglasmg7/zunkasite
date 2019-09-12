'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // Authentication error.
    warnMessage: '',
    // Email.
    email: '',
    // Password.
    password: ''
  },
  methods: {
    // Get products.
    deleteAccount(){
      axios({
        method: 'post',
        url: `/user/access/delete-account`,
        headers: {'csrf-token' : csrfToken},
        data: {email: this.email, password: this.password}
      })
      .then((res)=>{
        // Account removed.
        if (res.data.success) {
          window.location.href = '/user/access/account-deleted';
        }
        else {
          this.warnMessage = res.data.message;
        }
      })
      .catch((err)=>{
        console.error(`Error - deleteAccount(), err: ${err}`);
      });
    }
  } 
});
