// Search for products.
function _search(text){
  app.search = text;
  app.getProducts();
}

var app = new Vue({
  el: '#app',
  data: {
    // Banners
    banners: [
      '7567.jpg',
      'banner-dell.jpg'
    ],
    // Products.
    products: [],
    // New products.
    newProducts: [],
    // Best selling products.
    bestSellingProducts: [],
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
    // this.getProducts();
    this.getNewProducts();
    this.getBestSellingProducts();
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
    // Get new products.
    getNewProducts(page=1){
      axios({
        method: 'get',
        url: `/api/new-products/`,
        headers:{'csrf-token' : csrfToken}
      })
      .then((res)=>{
        this.newProducts = res.data.products;
      })
      .catch((err)=>{
        console.error(`Error - getNewProducts(), err: ${err}`);
      });
    },
    // Get best selling products.
    getBestSellingProducts(page=1){
      axios({
        method: 'get',
        url: `/api/best-selling-products/`,
        headers:{'csrf-token' : csrfToken}
      })
      .then((res)=>{
        this.bestSellingProducts = res.data.products;
      })
      .catch((err)=>{
        console.error(`Error - getBestSellingProducts(), err: ${err}`);
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