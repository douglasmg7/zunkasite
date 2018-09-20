// Search for products.
function _search(text){
  app.search = text;
  app.getProducts();
}

console.log('productList log.');

var app = new Vue({
  el: '#app',
  data: {
    products: [],
    // Product added to cart.
    productAddedToCart: {},
    // Curret page for pagination.
    page: 1,
    // Quantity of pages to show all products.
    pageCount: 1,
    // Text for search products.
    search: search,
    // Cart.
    cart: cart,
    // Test.
    test: '1234.45'
  },
  created() {
    // On reload page use the query string for search, not the input search.
    this.getProducts();
    // To show product added to cart.
    this.getPrdouctAddedToCart();
    // Test.
    this.test = this.test.replace('.', ',');
    console.log(this.test);
  },
  methods: {
    // Get products.
    getProducts(page=1){
      console.log('getting products.');
      axios({
        method: 'get',
        url: `/api/products/?page=${page}&search=${this.search}`,
        headers:{'csrf-token' : csrfToken}
      })
      .then((res)=>{
        this.products = res.data.products;
        this.page = res.data.page;
        this.pageCount = res.data.pageCount;
      })
      .catch((err)=>{
        console.error(`Error - getProducts(), err: ${err}`);
      });
    },
    getPrdouctAddedToCart(){
      let regExpResult = /[?&]productAddedToCart=([^&#]*)/.exec(window.location.href);
      if (regExpResult) {
        let product_id = regExpResult[1];
        axios({
          method: 'get',
          url: `/api/product/${product_id}`,
          headers:{'csrf-token' : csrfToken}
        })
        .then((res)=>{
          this.productAddedToCart = res.data.product;
        })
        .catch((err)=>{
          console.error(`Error - getProducts(), err: ${err}`);
        });
      }
    },
    // currency(val){
    //   return 'yR$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    // }
  },  
  filters: {
    // Format number to money format.
    // formatMoney(val){
    //   return 'yR$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    // },
    // Format number to money format.
    currency(val){
      let t1 = val.toFixed(2);
      console.log(`toFixed(2): ${t1}`);

      t2 = t1.replace('.', ',');
      console.log(`replace('.', ','): ${t2}`);
      // console.log(`replace('.', ','): ${t2}`);

      return val.toFixed(2).replace('\.', ',');
      // return val.toFixed(2).replace('.', ',');
      // return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },
    // currencyBr(val){
    //   return accounting.formatMoney(val, 'R$ ', 2, '.', ',');
    // },
    currencyInt(val){
      // return accounting.formatMoney(accounting.parse(val, ','), '', 2, '.', ',').split(',')[0];
      // return this.currency(val).split(',')[0];

      // return this.$options.filters.currency(val).split(',')[0];;
      return val.split(',')[0];
    },
    currencyCents(val){
      // return accounting.formatMoney(accounting.parse(val, ','), '', 2, '.', ',').split(',')[1];
      // return this.currency(val).split(',')[1];
      return val.split(',')[1];
    }
  },  
});