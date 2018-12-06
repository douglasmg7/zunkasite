// Search for products.
function _search(text){
  app.search = text;
  app.getProducts();
}

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
    cart: cart
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
    currency(val){
      return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },
    // currencyBr(val){
    //   return accounting.formatMoney(val, 'R$ ', 2, '.', ',');
    // },
    currencyInt(val){
      return val.split(',')[0];
    },
    currencyCents(val){
      return val.split(',')[1];
    }
  },  
});