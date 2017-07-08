<template lang='pug'>
  div
    nav.navbar.navbar-inverse.navbar-static-top
      //- .container-fluid
      .container
        .navbar-header
          button.navbar-toggle.collapsed(type='button' data-toggle='collapse' data-target='#navbar' aria-expanded='false' aria-controls='navbar')
            span.sr-only Toggle navigation
            span.icon-bar
            span.icon-bar
            span.icon-bar     
          // Home.
          a.navbar-brand(href='/') ZUNKA
        #navbar.navbar-collapse.collapse
          ul.nav.navbar-nav.navbar-right
            li
              // Username.
              a(v-if="this.user.username") {{this.user.username}}
            li
              // Sign-in.
              a(href='/users/login' v-if="!this.user.username") Entrar
            li
              // Cart.
              a(href='#') Carrinho
            li
              // Admin.
              a(href='/configProducts/store' v-if="this.user.group == 'admin'") Admin
            li
              // Exit.
              a(href='/users/logout' v-if="this.user.username") Sair
          .navbar-form.navbar-right
            input.form-control(v-model='search' v-on:keyup.enter='getProducts()' placeholder='O que você procura?' type='text' size='40')
    .container
      .row
        .col-md-3(v-for='(product, index) in products')
          .thumbnail
            a.product(:href='"product/" + product._id')
              img(:src='getImgUrl(product)')
              h4.description {{product.storeProductTitle}}
              h3.price
                sup R$
                | {{formatProdcutPrice(product) | currencyInt}}
                sup {{formatProdcutPrice(product) | currencyCents}}
      .row
        .col-md-10.col-md-offset-1
          footer
</template>
<script>
  /* globals accounting */
  'use strict';
  import wsPath from '../bin/wsPath';
  import accounting from 'accounting';

  // Initialize.
  $(document).ready(function(){
    // Initialize dropdown.
    $('.ui.dropdown')
      .dropdown({duration: 0});
  });
  // components
  // import menuProducts from './menuProducts.vue';
  // import productsStoreDetail from './productsStoreDetail.vue';
  // let veeValidate = require('vee-validate');
  export default {
    name: 'store',
    data: function(){
      return {
        products: [],
        // curret page for pagination
        page:1,
        // number of pages for pagination
        pageCount: 1,
        // text for search products
        search: ''
        // pulga: 'asdfasdfasdf'
      }
    },
    // Text for search products and user logged.
    // props:['$http', 'initSearch', 'username', 'group'],
    props:['$http', 'user', 'initSearch'],
    created() {
      // search from a product item page, not from this store page
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
      },
      logout(){
        this.$http.get('/users/logout')
          .then((res)=>{
            console.log(res.body);
          })
          .catch((err)=>{
            console.log(`Error - logout(), err: ${err}`);
          });
      },
      getImgUrl(product){
        let selImgName = 'no-image';
        for (var i = 0; i < product.images.length; i++) {
          if (product.images[i].selected) {
            selImgName = product.images[i].name;
            // console.info('filename: ' + product._id + '/' + selImgName);
            break;
          }
          
        }
        return `/img/${product._id}/${selImgName}`;
      },
      formatProdcutPrice(product){
        return product.storeProductPrice.toString().replace(',', '.');
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
    },
  }
</script>
<style lang='stylus'>
  a.product
    text-decoration: none;
    color: green
  .price
    clear: both
    margin-top: 0.6em
    color: black
    // font-size: 1.8em
  .price > sup,
  .price > sup
    font-size: 0.5em
    top: -0.6em
    padding-right: 0.3em
    padding-left: 0.2em
  footer
    height: 50px    
</style>
