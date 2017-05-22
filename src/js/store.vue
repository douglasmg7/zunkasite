<template lang='pug'>
  div
    //- .ui.black.inverted.attached.stackable.menu
    .ui.black.inverted.borderless.attached.stackable.menu
      .ui.container
        a.ui.link.item(href='/')
          i.big.home.icon Zunka
        .ui.right.item
          .ui.small.icon.input
            input(v-model='search' v-on:keyup.enter='getProducts()' placeholder='O que você procura?' type='text' size='40')
            i.search.link.icon(v-on:click='getProducts()')
        a.item
          i.big.cart.icon
    //- .ui.center.aligned.container
    .ui.left.aligned.container
      //- .ui.top.attached.segment
      //- .ui.vertical.very.padded.segment
      .ui.basic.padded.segment
        .ui.five.doubling.cards
          a.ui.card(v-for='product in products', :href='"product/" + product._id')
            .image
              img(:src='"/img/allnations/products/" + product.dealerProductId + "/dealer-img-01.jpeg"')
            .content
              .description {{product.storeProductTitle}}
              .price
                sup R$
                | {{product.storeProductPrice | currencyInt}}
                sup {{product.storeProductPrice | currencyCents}}
    //- .ui.hidden.divider
    //- .ui.center.aligned.container
    //-   .ui.pagination.menu
    //-     div(v-for='n in pageCount')
    //-       a.item(@click='getProducts(n)' v-bind:class='{"active": n==page}') {{n}}
    //- .ui.hidden.divider
</template>
<script>
  /* globals accounting */
  'use strict';
  import wsPath from '../../bin/wsPath';
  import accounting from 'accounting';
  // components
  // import menuProducts from './menuProducts.vue';
  // import productsStoreDetail from './productsStoreDetail.vue';
  // let veeValidate = require('vee-validate');
  export default {
    components: {
      // menuProducts,
      // productsStoreDetail
    },
    data: function(){
      return {
        products: ['void'],
        // deep clone of selected product
        // selectedProduct: {},
        // productMakers: ['void'],
        // productCategories: ['void'],
        // curret page for pagination
        page:1,
        // number of pages for pagination
        pageCount: 1,
        // text for search products
        search: ''
      }
    },
    // text for search products
    props:['initSearch'],
    created() {
      // search from a product item page, not from this store page
      this.search = this.initSearch;
      this.getProducts();
    },
    methods: {
      // retrive products page
      getProducts(page=1){
        this.$http.get(`${wsPath.store}/products-commercialize/?page=${page}&search=${this.search}`)
          .then((res)=>{
            this.products = res.body.products;
            this.page = res.body.page;
            this.pageCount = res.body.pageCount;
          })
          .catch((err)=>{
            console.log(`Error - getProducts(), err: ${err}`);
          });
      }
    },
    filters: {
      currencyBr(value){
        return accounting.formatMoney(value, 'R$ ', 2, '.', ',');
      },
      currencyInt(value){
        return accounting.formatMoney(value, '', 2, '.', ',').split(',')[0];
      },
      currencyCents(value){
        return accounting.formatMoney(value, '', 2, '.', ',').split(',')[1];
      }
    }
  }
</script>
<style lang='stylus'>
  .ui.cards > .card > .content > .price,
  .ui.card > .content > .price
    clear: both
    color: rgb(0, 0, 0)
    margin-top: 0.6em
    font-size: 1.8em
  .ui.cards > .card > .content > .price > sup,
  .ui.card > .content > .price > sup
    font-size: 0.5em
    top: -0.6em
    padding-right: 0.3em
    padding-left: 0.1em
</style>
