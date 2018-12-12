'use strict';

// Search for products.
function _search(text){
  window.location.href = `/search?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // Warn message.
    warnMessage: '',
    // Cpf.
    cpf: cpf,
  },
  methods: {
    save(){
      axios({
        method: 'post',
        url: `/user/access/edit-cpf`,
        headers: {'csrf-token' : csrfToken},
        data: { cpf: this.cpf }
      })
      .then((res)=>{
        // Successful change the name.
        if (res.data.success) {
          window.location.href = '/user/access';
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
