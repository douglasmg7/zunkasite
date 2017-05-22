<template lang='pug'>
  div
    menu-products(active='store' v-on:input='search=arguments[0]' v-on:search='getProducts()')
    table.ui.compact.table
      thead
        tr
          // th.text-capitalize id
          th.clickable(@click="selectColOrder('code-store')") Hardplus id
          th.clickable(@click="selectColOrder('dealerCode')") Titulo
          th.clickable(@click="selectColOrder('dealer')") Fornecedor
          th.clickable(@click="selectColOrder('dealerCode')") Forn. Id
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
          td.clickable(@click="showProduct(product)") {{product.dealer}}
          td.clickable(@click="showProduct(product)") {{product.dealerProductId}}
          td.clickable(@click="showProduct(product)") {{product.dealerProductLocation}}
          td.clickable(@click="showProduct(product)") {{product.dealerProductQtd}}
          td.clickable(@click="showProduct(product)") {{product.storeProductPrice | currencyBr}}
    .ui.hidden.divider
    .ui.center.aligned.container
      .ui.pagination.menu
        div(v-for='n in pageCount')
          a.item(@click='getProducts(n)' v-bind:class='{"active": n==page}') {{n}}
    .ui.hidden.divider
    products-store-detail(:product='selectedProduct', :productMakers='productMakers', :productCategories='productCategories' @save='updateProduct')
</template>
<script>
  /* globals accounting */
  'use strict';
  import wsPath from '../../bin/wsPath';
  import accounting from 'accounting';
  // components
  import menuProducts from './menuProducts.vue';
  import productsStoreDetail from './productsStoreDetail.vue';
  // let veeValidate = require('vee-validate');
  export default {
    components: {
      menuProducts,
      productsStoreDetail
    },
    data: function(){
      return {
        products: ['void'],
        // deep clone of selected product
        selectedProduct: {},
        productMakers: ['void'],
        productCategories: ['void'],
        // curret page for pagination
        page:1,
        // number of pages for pagination
        pageCount: 1,
        // text for search products
        search: ''
      }
    },
    created() {
      this.getProducts();
      this.getDropdown();
    },
    methods: {
      // retrive products page
      getProducts(page=1){
        this.$http.get(`${wsPath.store}?page=${page}&search=${this.search}`)
          .then((res)=>{
            this.products = res.body.products;
            this.page = res.body.page;
            this.pageCount = res.body.pageCount;
          })
          .catch((err)=>{
            console.log(`Error - getProducts(), err: ${err}`);
          });
      },
      showProduct(product){
        // deep clone
        this.selectedProduct = JSON.parse(JSON.stringify(product));
        // open modal
        $('.ui.small.modal')
          // init and update dropdown
          .modal({
              onShow: function (){
                setTimeout(function () {
                  $('.ui.dropdown').dropdown({duration: 0});
                  // modal opened event for product detail
                  this.eventHub.$emit('modal-onShow');
                }, 100);}
              // onApprove: function (){
              //   console.log('onApprove');
              //   return false;
              // },
              // onDeny: function () {
              //   console.log('onDeny');
              //   return false;
              // }
          })
          // fast open
          .modal('setting', 'duration', 0)
          // open modal
          .modal('show');
      },
      updateProduct(){
        this.products.forEach((element, index)=>{
          if (element._id === this.selectedProduct._id) {
            this.$set(this.products, index, this.selectedProduct);
            return
          }
        });
      },
      getDropdown(){
        this.$http.get(`${wsPath.store}/dropdown`)
          .then((res)=>{
            this.productMakers = res.body.productMakers;
            this.productCategories = res.body.productCategories;
          })
          .catch((err)=>{
            console.log(`Error - getDropdown(), err: ${JSON.stringify(err)}`);
          });
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
