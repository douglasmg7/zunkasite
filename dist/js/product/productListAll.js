'use strict';

// Search for products.
function _search(text){
  window.location.href = `/search?page=1&search=${text}`;
}

var app = new Vue({
  el: '#app',
  data: {
    // // Banners
    // banners: banners,
    // // Visible banner.
    // visibleBanner: 0,
    // // Change banner automaticly.
    // bannerAutoChange: true, 
    // Products.
    products: [],
    // // New products.
    // newProducts: [],
    // // Best selling products.
    // bestSellingProducts: [],
    // Product added to cart.
    productAddedToCart: {},
    // Curret page for pagination.
    page: 1,
    // Quantity of pages to show all products.
    pageCount: 1,
    // Text for search products.
    search: search,
    // Sort.
    sort: 'alfa',
    // Cart.
    cart: cart,
    // Categories.
    categories: [],
    // Filter categories.
    categoriesFilter: []
  },
  created() {
    // On reload page use the query string for search, not the input search.
    this.getProducts();
    // this.getNewProducts();
    // this.getBestSellingProducts();
    // To show product added to cart.
    this.getPrdouctAddedToCart();
    // Timer for change banner.
    // setInterval(this.changeBanner, 3000);
  },
  methods: {
    // Get products.
    getProducts(page=1){
      axios({
        method: 'get',
        url: `/api/products`,
        // url: `/api/products/?page=${page}&search=${this.search}`,
        params: {
          page: page,
          search: this.search,
          categoriesFilter: this.categoriesFilter
        },
        headers:{'csrf-token' : csrfToken}
      })
      .then((res)=>{
        this.products = res.data.products;
        this.page = res.data.page;
        this.pageCount = res.data.pageCount;
        this.categories = res.data.categories;
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        // console.log(this.categories);
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
  }
});
