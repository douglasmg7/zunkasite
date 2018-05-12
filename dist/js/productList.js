// Search for products.
function _search(text){
  app.search = text;
  app.getProducts();
}

var app = new Vue({
  el: '#app',
  data: {
    products: [],
    // user: user,
    // Curret page for pagination.
    page: 1,
    // Number of pages for pagination.
    pageCount: 1,
    // Text for search products.
    search: ''
  },
  created() {
    // On reload page use the query string for search, not the input search.
    this.getProducts();
    // To show product added to cart.
    this.getPrdouctAddedToCart();
  },
  methods: {
    // Get products.
    getProducts(page=1){
      axios({
        method: 'get',
        url: `/products/?page=${page}&search=${this.search}`,
        headers:{'csrf-token' : csrfToken}
      })
      .then((res)=>{
        this.products = res.data.products;
        this.page = res.data.page;
        this.pageCount = res.data.pageCount;
        // console.log('products count: ', this.products.length);
      })
      .catch((err)=>{
        console.log(`Error - getProducts(), err: ${err}`);
      });
    },
    getPrdouctAddedToCart(){
      let regExpResult = /[?&]productAddedToCart=([^&#]*)/.exec(window.location.href);
      if (regExpResult) {
        console.log(regExpResult[1]);
      }
    }
  },  
  filters: {
    // Format number to money format.
    formatMoney(val){
      return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },
    currencyBr(value){
      return accounting.formatMoney(value, 'R$ ', 2, '.', ',');
    },
    currencyInt(value){
      return accounting.formatMoney(accounting.parse(value, ','), '', 2, '.', ',').split(',')[0];
    },
    currencyCents(value){
      return accounting.formatMoney(accounting.parse(value, ','), '', 2, '.', ',').split(',')[1];
    }
  },  
});