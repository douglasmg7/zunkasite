// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // User.
    user: user
  },
  methods: {
    exit(){
      window.location.href = '/';
    },
  },
});