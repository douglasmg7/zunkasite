// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // Authentication error.
    warnMessage: '',
    // Success message.
    successMessage: '',
    // Name.
    name: '',
    // Email.
    email: '',
    // Password.
    password: '',
    // Confirm password.
    passwordConfirm: '',
  },
  methods: {
    // Get products.
    signup(){
      axios({
        method: 'post',
        url: `/users/api/signup`,
        headers: {'csrf-token' : csrfToken},
        data: {name: this.name, email: this.email, password: this.password, passwordConfirm: this.passwordConfirm}
      })
      .then((res)=>{
        // Singin successful.
        if (res.data.success) {
          this.warnMessage = '';
          this.successMessage = res.data.message;
        }
        // Not success on signin.
        else {
          console.log(res.data.message);
          this.warnMessage = res.data.message;
        }
      })
      .catch((err)=>{
        console.error(`Error - signup(), err: ${err}`);
      });
    }
  } 
});