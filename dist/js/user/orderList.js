// Search for orders.
function _search(text){
  app.search = text;
  app.getOrders(1);
}

var app = new Vue({
  el: '#app',
  data: {
    orders: [],
    // user: user,
    // Curret page for pagination.
    page: page,
    // Number of pages for pagination.
    pageCount: 1,
    // Text for search orders.
    search: search
  },
  created() {
    // On reload page use the query string for search, not the input search.
    this.getOrders();
  },
  methods: {
    // Get orders.
    getOrders(page=this.page){
      axios({
        method: 'get',
        url: `/users/api/orders/${this.order._id}?page=${page}&search=${this.search}`,
        headers:{'csrf-token' : csrfToken}
      })
      .then((res)=>{
        this.orders = res.data.orders;
        this.page = res.data.page;
        this.pageCount = res.data.pageCount;
        console.log('orders count: ', this.orders.length);
      })
      .catch((err)=>{
        console.log(`Error - getOrders(), err: ${err}`);
      });
    },
  },
  filters: {
    // Format number to money format.
    formatMoney(val){
      return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  }
});