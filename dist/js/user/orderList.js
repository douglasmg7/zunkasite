'use strict';

// Brasilian months names.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // All orders from search.
    orders: [],
    // Selected order.
    orderSelec: {},
    // user: user,
    // Curret page for pagination.
    page: 1,
    // Number of pages for pagination.
    pageCount: 1,
    // Text for search orders.
    searchOrder: '',
    // Show modal.
    showModal: false
  },
  created() {
    // On reload page use the query string for search, not the input search.
    this.getOrders();
  },
  methods: {
    // Get orders.
    getOrders(page=1){
      axios({
        method: 'get',
        url: `/user/api/orders?page=${page}&search=${this.searchOrder}`,
        headers:{'csrf-token' : csrfToken}
      })
      .then((res)=>{
        this.orders = res.data.orders;
        this.page = res.data.page;
        this.pageCount = res.data.pageCount;
      })
      .catch((err)=>{
        console.log(`Error - getOrders(), err: ${err}`);
      });
    },
    // Show order detail on modal window.
    showOrderDetail(index){
      this.orderSelec = this.orders[index];
      this.showModal = true;
    },
    // Hide order detail modal.
    hideOrderDetail(){
      this.showModal = false;
    }
  },
  filters: {
    // Format number to money format.
    formatMoney(val){
      return 'R$ ' + val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },
    // Format number to money format.
    formatDate(val){
      let d = new Date(val);
      return `${d.getDate()}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
    }
  }
});
