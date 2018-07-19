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
    // Mobile number.
    mobileNumber: mobileNumber,
    // Password.
    password: ''
  },
  methods: {
    save(){
      axios({
        method: 'post',
        url: `/user/access/edit-mobile-number`,
        headers: {'csrf-token' : csrfToken},
        data: { mobileNumber: this.mobileNumber, password: this.password }
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