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