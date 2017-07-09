<template lang='pug'>
  div
    menu-products(active='store' v-bind:user='user' v-on:input='search=arguments[0]' v-on:search='getProducts()' v-on:newProduct='showNewProduct()')
    table.ui.compact.table
      thead
        tr
          // th.text-capitalize id
          th.clickable(@click="selectColOrder('code-store')") Código
          th.clickable(@click="selectColOrder('dealerCode')") Título
          th.clickable(@click="selectColOrder('dealerName')") Fornecedor
          //- th.clickable(@click="selectColOrder('dealerCode')") Forn. Id
          th.clickable(@click="selectColOrder('stockLocation')") Local
          th.clickable(@click="selectColOrder('stockQtd')") Estoque
          th.clickable(@click="selectColOrder('priceNum')") Preço
      tbody
        tr(
          v-for="product in products"
          v-bind:class='{"product-commercialize": product.storeProductCommercialize, "product-active": product.dealerProductActive && (product.dealerProductQtd > 5)}'
        )
          // td {{$index + 1}}
          td.clickable(@click="showProduct(product)" v-bind:data-code="product.code" v-bind:title='product.dealerProductTitle') {{product.storeProductId}}
          td.clickable(@click="showProduct(product)") {{product.storeProductTitle}}
          td.clickable(@click="showProduct(product)") {{product.dealerName}}
          //- td.clickable(@click="showProduct(product)") {{product.dealerProductId}}
          td.clickable(@click="showProduct(product)") {{product.dealerProductLocation}}
          td.clickable(@click="showProduct(product)") {{product.dealerProductQtd}}
          td.clickable(@click="showProduct(product)") {{product.storeProductPrice | currencyBr}}
    .ui.hidden.divider
    .ui.center.aligned.container
      .ui.pagination.menu
        div(v-for='n in pageCount')
          a.item(@click='getProducts(n)' v-bind:class='{"active": n==page}') {{n}}
    .ui.hidden.divider
    products-store-detail(
      ref='productStoreDetail'
      :$http='$http',
      :product='selectedProduct', 
      :productMakers='productMakers', 
      :productCategories='productCategories',
      @productSaved='updateProduct()',
      @productIncluded='includeProduct()'
      @productDeleted='removeProduct()')
</template>
<script>
  /* globals accounting */
  'use strict';
  import wsPath from '../bin/wsPath';
  import accounting from 'accounting';
  // Components.
  import menuProducts from './menuProducts.vue';
  import productsStoreDetail from './productsStoreDetail.vue';
  // let veeValidate = require('vee-validate');
  export default {
    ref: 'productStore',
    components: {
      menuProducts,
      productsStoreDetail
    },
    data: function(){
      return {
        products: ['void'],
        // Deep clone of selected product.
        selectedProduct: {},
        productMakers: ['void'],
        productCategories: ['void'],
        // Curret page for pagination.
        page:1,
        // Number of pages for pagination.
        pageCount: 1,
        // Text for search products.
        search: ''
      }
    },
    props: ['$http', 'user'],
    created() {
      this.getProducts();
      this.getDropdown();
    },
    methods: {
      // Get products page.
      getProducts(page=1){
        // console.warn('search: ', this.search);
        this.$http.get(`${wsPath.store}?page=${page}&search=${this.search}`)
          .then((res)=>{
            this.products = res.body.products;
            this.page = res.body.page;
            this.pageCount = res.body.pageCount;
          })
          .catch((err)=>{ console.error(err); });
      },
      // Open modal with products detail.
      showProduct(product){
        // Deep clone.
        this.selectedProduct = JSON.parse(JSON.stringify(product));
        // Open modal.
        $('.ui.small.modal').modal('show');
      },
      showNewProduct(){
        // Create a new product.
        this.selectedProduct = {
          dealerName: '',
          storeProductId: '',
          storeProductTitle: '',
          storeProductDetail: '',
          storeProductDescription: '',
          storeProductTechnicalInformation: '',
          storeProductAdditionalInformation: '',
          storeProductMaker: '',
          storeProductCategory: '',
          storeProductWarrantyDays: '',
          storeProductWarrantyDetail: '',
          storeProductMarkup: 0,
          storeProductDiscountEnable: false,
          storeProductDiscountValue: 0,
          storeProductDiscountType: '%',
          storeProductCommercialize: false,
          dealerProductTitle: '',
          dealerProductWarrantyDays: '',
          dealerProductQtd: 0,
          dealerProductActive: true,
          dealerProductCommercialize: true,
          dealerProductPrice: 0,
          images: [],
          // Modal must delete this product if user not save it.
          // To modal know which button to show.
          isNewProduct: true
        };
        // Insert product on db.
        this.$http.post(`${wsPath.store}/`, this.selectedProduct)
          .then((res)=>{
            // Include _id received from db.
            this.selectedProduct._id = res.body._id;
          })
          .catch((err)=>{ console.error(err); });
        // Open modal.
        $('.ui.small.modal').modal('show');
      },      
      // Update product saved by modal.
      updateProduct(){
        try {
          // Look for product to be updated.
          this.products.forEach((element, index)=>{
            if (element._id === this.selectedProduct._id) {
              this.$set(this.products, index, this.selectedProduct);  
            }
          });
        } 
        catch (err){ console.error(err); }
      },
      // Update product saved by modal.
      includeProduct(){
        try {
          // Look for product to be updated.
          this.products.push(this.selectedProduct);
        } 
        catch (err){ console.error(err); }
      },      
      // Remove product deleted by modal.
      removeProduct(){
        // Look for product to update.
        this.products.forEach((element, index)=>{
          if (element._id === this.selectedProduct._id) {
            // Remove product from the list.
            this.$delete(this.products, index);
          }
        });
      },      
      // Get dropdown options.
      getDropdown(){
        this.$http.get(`${wsPath.store}/dropdown`)
          .then((res)=>{
            this.productMakers = res.body.productMakers;
            this.productCategories = res.body.productCategories;
          })
          .catch((err)=>{ console.error(err); });
      }
    },
    filters: {
      currencyBr(value){
        return accounting.formatMoney(value, 'R$ ', 2, '.', ',');
      }
    }
  }
</script>
<style lang='stylus'>
  th.clickable, td.clickable
    cursor: pointer
  tr.product-commercialize
    background-color: #F2DEDE
  tr.product-commercialize.product-active
    background-color: #bdffbd
</style>
