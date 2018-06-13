'use strict';

// Brasilian months names.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // All orders from search.
    orders: [],
    // Order selected index.
    orderSelecIndex: -1,
    // Order selected.
    orderSelec: {},
    // Curret page for pagination.
    page: 1,
    // Number of pages for pagination.
    pageCount: 1,
    // Text for search orders.
    searchOrder: '',
    // Show modal.
    showModal: false,
    // Filter.
    filter: {
      showPlacedOrders: true,
      showPaidOrders: true,
      showShippedOrders: true,
      showDeliveredOrders: true,
      showCanceledOrders: true
    }
  },
  created() {
    // On reload page use the query string for search, not the input search.
    this.getOrders();
  },
  watch: {
    filter: {
      handler(val){
        this.getOrdersFilter();
      },
      deep: true
    }
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
    // Get orders with filter.
    getOrdersFilter(page=1){
      axios({
        method: 'get',
        url: `/admin/api/orders_?page=${page}&search=${this.searchOrder}&filter=${JSON.stringify(this.filter)}`,
        // url: `/admin/api/orders_?page=${page}&search=${this.searchOrder}&filter=${this.filter}`,
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
      this.orderSelecIndex = index;
      this.orderSelec = this.orders[index];
      this.showModal = true;
    },
    // Hide order detail modal.
    hideOrderDetail(){
      this.showModal = false;
    },
    // Get status order.
    status(order){
      switch(order.status) {
        case 'canceled':
          return 'Cancelado';
        case 'delivered':
          return 'Entrege';
        case 'shipped':
          return 'Enviado';
        case 'paid':
          return 'Pago';
        case 'placed':
          return 'Aberto';
        default:
          return '';
      }
    },
    // Set order status from selected order.
    setStatus(status){
      if(window.confirm('Confirma alteração do status?')){
        axios({
          method: 'post',
          url: `/admin/api/order/status/${this.orderSelec._id}/${status}`,
          headers:{'csrf-token' : csrfToken}
        })
        .then((res)=>{
          // Update selected order and orders.
          // console.log(`data: ${JSON.stringify(res.data)}`);
          this.orderSelec = res.data.order;
          this.$set(this.orders, this.orderSelecIndex, res.data.order);
        })
        .catch((err)=>{
          console.error(`Error - setStatus(), err: ${err}`);
        });
      }
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
