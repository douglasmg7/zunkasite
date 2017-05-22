<template lang='pug'>
  div
    menu-products(active='allNations' v-on:input='search=arguments[0]' v-on:search='getProducts()')
    table.ui.compact.table
      thead
        tr
          // th.text-capitalize id
          th.clickable(@click="selectColOrder('desc')") Descrição
          th.clickable(@click="selectColOrder('stockQtd')") Estoque
          th.clickable(@click="selectColOrder('priceNum')") Preço
          th.clickable(@click="selectColOrder('available')") Disp
          th.clickable(@click="selectColOrder('id-store')") Id loja
      tbody
        tr(
          v-for='product in products'
          v-bind:class='{"commercialize": product.commercialize, "available-prd": product.available, "active-prd": product.active, "stock-prd": product.stockQtd > 5 }'
        )
          // td {{$index + 1}}
          td.clickable(@click="showProductDetail(product)" v-bind:data-code="product.code") {{product.desc}}
          td.clickable(@click="showProductDetail(product)") {{product.stockQtd}}
          td.clickable(@click="showProductDetail(product)") {{product.price | currencyBr}}
          td.clickable(@click="showProductDetail(product)") {{product.available && product.active ? 'Sim' : 'Não'}}
          td.clickable(@click="showProductDetail(product)") {{product.storeProductId ? product.storeProductId : ''}}
    .ui.hidden.divider
    .ui.center.aligned.container
      .ui.pagination.menu
        div(v-for='n in pageCount')
          a.item(@click='getProducts(n)' v-bind:class='{"active": n==page}') {{n}}
    .ui.hidden.divider
    products-allnations-detail(:product='selectedProduct' @save='updateProduct')
</template>
<script>
  /* globals accounting */
  'use strict';
  import wsPath from '../../bin/wsPath';
  import accounting from 'accounting';
  // components
  import menuProducts from './menuProducts.vue';
  import productsAllnationsDetail from './productsAllNationsDetail.vue';
  // let veeValidate = require('vee-validate');
  // $(document).ready(function(){
  // });
  export default {
    components: {
      menuProducts,
      productsAllnationsDetail
    },
    data: function(){
      return {
        // All products.
        products: ['void'],
        // deep clone of selected product
        selectedProduct: {},
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
    },
    methods: {
      // retrive products page
      getProducts(page=1){
        this.$http.get(`${wsPath.allNations}?page=${page}&search=${this.search}`)
          .then((res)=>{
            this.products = res.body.products;
            this.page = res.body.page;
            this.pageCount = res.body.pageCount;
          })
          .catch((err)=>{
            console.log(`Error - getProducts(), err: ${err}`);
          });
      },
      showProductDetail(product){
        // deep clone
        this.selectedProduct = JSON.parse(JSON.stringify(product));
        // open modal
        $('.ui.small.modal')
          .modal('setting', 'duration', 0)
          .modal('show');
      },
      updateProduct(){
        this.products.forEach((element, index)=>{
          if (element._id === this.selectedProduct._id) {
            this.$set(this.products, index, this.selectedProduct);
            return
          }
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
  tr.commercialize
    background-color: #F2DEDE
  tr.commercialize.available-prd.active-prd.stock-prd
    background-color: #bdffbd
</style>
