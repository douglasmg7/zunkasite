(function () {
'use strict';

// Brasilian months names.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Brasilian months names.
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
    showModal: false,
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
        url: `/admin/api/orders?page=${page}&search=${this.searchOrder}`,
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
    },
    // Get status order.
    status(order){
      let status = '';
      // Canceled.
      if (order.isCanceled) {
        status = 'Cancelado';
      } 
      // Delivered.
      else if (order.isDelivered) {
        status = 'Entrege';
      }
      // Shipped.
      else if (order.isShipped) {
        status = 'Enviado';
      }
      // Paid.
      else if (order.isPaid) { 
        status = 'Pago';
      }
      // Placed.
      else if (order.isPlaced) { 
        status = 'Aberto';
      }
      return status;
    },
    setStatus(order, status){
      axios({
        method: 'post',
        url: `/admin/api/order/status/${order._id}/${status}`,
        headers:{'csrf-token' : csrfToken}
      })
      .then((res)=>{
        console.log('setStatus ok');
      })
      .catch((err)=>{
        console.error(`Error - setStatus(), err: ${err}`);
      });
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

}());
