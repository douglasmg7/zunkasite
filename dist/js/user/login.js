// Search for products.
function _search(text){
  app.search = text;
}

var app = new Vue({
  el: '#app',
  data: {
    // Authentication error.
    authError: '',
    // Email.
    email: '',
    // Password.
    password: '',
    // Curret page for pagination.
    page: 1,
    // Quantity of pages to show all products.
    pageCount: 1,
    // Text for search products.
    search: search,
  },
  methods: {
    // Get products.
    signin(){
      console.log('signin');
      axios({
        method: 'post',
        url: `/users/api/login`,
        headers: {'csrf-token' : csrfToken},
        data: {email: this.email, password: this.password}
      })
      .then((res)=>{
        console.log(`res.data: ${JSON.stringify(res.data)}`);
      })
      .catch((err)=>{
        console.error(`Error - signin(), err: ${err}`);
      });
    }
  } 
});