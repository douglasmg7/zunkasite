// Brasilian name of the months.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
// Search for orders.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
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
        url: `/users/api/orders?page=${page}&search=${this.search}`,
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
  },
  filters: {
    // Format number to money format.
    formatMoney(val){
      return 'R$ ' + val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },
    // Format number to money format.
    formatDate(val){
      let d = new Date(val);
      return `${d.getDate()} - ${MONTHS[d.getMonth()]} - ${d.getFullYear()}`;
    }
  }
});