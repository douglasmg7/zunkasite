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
    // Email.
    email: email,
    // New email.
    newEmail: '',
    // Email confirmation.
    newEmailConfirm: '',
    // Password.
    password: ''
  },
  methods: {
    exit(){
      window.location.href = '/user/account';
    },
    save(){
      axios({
        method: 'post',
        url: `/user/access/edit-email`,
        headers: {'csrf-token' : csrfToken},
        data: { newEmail: this.newEmail, newEmailConfirm: this.newEmailConfirm, password: this.password }
      })
      .then((res)=>{
        // Successful change the name.
        if (res.data.success) {
          window.location.href = '/user/signin';
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