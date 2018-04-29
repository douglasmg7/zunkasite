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
      this.$http.put(`/cart/add/${this.product._id}`, { _csrf: this.csrfToken })
      .then((res)=>{
        // Success.
        if (res.body.success) {
          window.location.href = `/last-product-added-to-cart/${this.product._id}`;
        }
        // console.log(res);
      })
      .catch((err)=>{
        console.error(err);
      });
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
    currencyBr(value){ return accounting.formatMoney(value, "R$ ", 2, ".", ","); }
  },
});