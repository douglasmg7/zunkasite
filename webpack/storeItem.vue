<template lang='pug'>
  div
    .ui.black.inverted.borderless.attached.stackable.menu
      // Home.
      a.ui.link.item(href='/')
        h2 Zunka
      .ui.right.inverted.borderless.stackable.menu
        // Search.
        .ui.item
          .ui.small.icon.input
            input(v-model='search' v-on:keyup.enter='getProducts()' placeholder='O que você procura?' type='text' size='40')
            i.search.link.icon(v-on:click='getProducts()')
        // User name.
        .ui.item
          i.large.user.icon(v-if="this.user.username") 
          | {{this.user.username}}
        // Sign-in.
        a.ui.item(href='users/login' v-if="!this.user.username")
          i.large.icon.sign.in
          | Entrar
        // Cart.
        a.ui.item
          i.large.cart.icon
        // Config.
        a.ui.item(href='/configProducts/store' v-if="this.user.group == 'admin'")
          i.large.configure.icon
        // Exit.
        a.ui.item(href='users/logout' v-if="this.user.username")
          i.large.sign.out.icon
          | Sair   
    .ui.center.aligned.container
      .ui.basic.padded.segment
        .ui.item
          .image
            img(:src='imgUrl()')
          .content
            .header {{product.storeProductTitle}}
            .description {{product.storeProductDescPrimary}}
            .price
              sup R$
              | {{product.storeProductPrice | currencyInt}}
              sup {{product.storeProductPrice | currencyCents}}
</template>
<script>
  /* globals accounting */
  'use strict';
  import wsPath from '../bin/wsPath';
  import accounting from 'accounting';

  export default {
    data: function(){
      return {
        // text for search products
        search: ''
      }
    },
    props:['user', 'product'],
    mounted(){
      // console.log('init');
      // console.log(this.product.dealer);
      // // console.log(vueProduct.dealer);
      // console.log('end');
    },
    methods: {
      // Retrive products page.
      getProducts(page=1){
        window.location.href = `/?page=1&search=${this.search}`;
      },
      imgUrl(){
        return `/img/${this.product.dealer.replace(/\s/g, '')}/products/${this.product.dealerProductId}/dealer-img-01.jpeg`;
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
  .ui.item > .content > .price
    clear: both
    color: rgb(0, 0, 0)
    margin-top: 0.6em
    font-size: 1.8em
  .ui.item > .content > .price > sup
    font-size: 0.5em
    top: -0.6em
    padding-right: 0.3em
    padding-left: 0.1em
</style>
