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
  },
  methods: {
    // Get products.
    reset(){
      axios({
        method: 'post',
        url: `/user/api/forgottenPassword`,
        headers: { 'csrf-token' : csrfToken },
        data: { email: this.email }
      })
      .then((res)=>{
        // Reset successful.
        if (res.data.success) {
          this.warnMessage = '';
          this.successMessage = res.data.message;
        }
        // Unsuccessful reset.
        else {
          this.successMessage = '';
          this.warnMessage = res.data.message;
        }
      })
      .catch((err)=>{
        console.error(`Error - reset(), err: ${err}`);
      });
    },
  } 
});