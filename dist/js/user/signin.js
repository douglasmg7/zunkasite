// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // Authentication error.
    warnMessage: warnMessage,
    // Success message.
    successMessage: successMessage,
    // Email.
    email: '',
    // Password.
    password: ''
  },
  methods: {
    // Get products.
    signin(){
      axios({
        method: 'post',
        url: `/users/api/signin`,
        headers: {'csrf-token' : csrfToken},
        data: {email: this.email, password: this.password}
      })
      .then((res)=>{
        // Singin successful.
        if (res.data.success) {
          this.warnMessage = '';
          window.location.href = '/';
        }
        // Not success on signin.
        else {
          this.warnMessage = res.data.message;
        }
      })
      .catch((err)=>{
        console.error(`Error - signin(), err: ${err}`);
      });
    },
    signup(){
      window.location.href = '/users/signup';
    }
  } 
});