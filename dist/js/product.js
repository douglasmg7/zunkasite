// // Search for products.
// function _search(text){

// };
// formatMoney(val){
//   return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
// };

var app = new Vue({
  el: '#app',
  data: {
    product: product,
    search: '',
    selectedThumbnail: 0,
    colsByRow: 4,
    imagesSelectedByRow: []
  },
  methods: {
    // Accaunting.
    accountingParse: accounting.parse,
    // Add product to cart.
    addToCart(){
      axios({
        method: 'put',
        url:`/cart/add/${product._id}`,
        headers:{'csrf-token' : csrfToken},
        data: { product: product }
      })
      .then(response => {
        // Product added to the cart.
        if (response.data.success) {
          window.location.href = `/last-product-added-to-cart/${this.product._id}`;
        }
      })
      .catch(err => {
        console.error(err);
      }) 
    }    
  },
  computed:{
    // Each line of product detail become one array item.
    productDetail(){
      if (this.product.storeProductDetail.trim() === '') {
        return new Array();
      }
      return this.product.storeProductDetail.split('\n');
    },
    // Each line of technical information become a array item, each item in line separeted by ; become array item.
    productInformationTechnical(){
      let infoTech = [];
      // Avoid create elements if there is nothing.
      if (this.product.storeProductTechnicalInformation.trim() === '') {
        return infoTech;
      }
      this.product.storeProductTechnicalInformation.split('\n').forEach(function(info) {
        infoTech.push(info.split(';'));
      });
      return infoTech;
    },
    // Each line of additional information become a array item, each item in line separeted by ; become array item.
    productInformationAdditional(){
      let infoAdd = [];
      // Avoid create elements if there is nothing.
      if (this.product.storeProductAdditionalInformation.trim() === '') {
        return infoAdd;
      }
      this.product.storeProductAdditionalInformation.split('\n').forEach(function(info) {
        infoAdd.push(info.split(';'));
      });
      return infoAdd;
    }
  },    
  filters: { 
    currencyBr(value){ return accounting.formatMoney(value, "R$ ", 2, ".", ","); },
    // currencyInt(value){
    //   return accounting.formatMoney(accounting.parse(value, ','), '', 2, '.', ',').split(',')[0];
    // },
    // currencyCents(value){
    //   return accounting.formatMoney(accounting.parse(value, ','), '', 2, '.', ',').split(',')[1];
    // }
  },
});