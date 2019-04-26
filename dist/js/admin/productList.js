'use strict';

// Search for products.
function _search(text){
  app.search = text;
  app.getProducts(1);
}

var app = new Vue({
  el: '#app',
  data: {
    products: [],
    // user: user,
    // Curret page for pagination.
    page: page,
    // Number of pages for pagination.
    pageCount: 1,
    // Text for search products.
    search: search
  },
  created() {
    // On reload page use the query string for search, not the input search.
    this.getProducts();
  },
  methods: {
    // Get products.
    getProducts(page=this.page){
      axios({
        method: 'get',
        url: `/admin/products?page=${page}&search=${this.search}`,
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
    // Go to product page.
    goToProductPage(product_id){
      window.location.href=`/admin/product/${product_id}`;
    }
  },
  filters: {
    // Format number to money format.
    formatMoney(val){
      // return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  }
});
