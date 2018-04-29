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
          a.navbar-brand(href='/')
            svg.icon: use(xlink:href='/icon/sprite.svg#ic_home_white_24px') 
            | ZUNKA          
        #navbar.navbar-collapse.collapse
          ul.nav.navbar-nav.navbar-right
            li
              // Username.
              a(href='/users/account' v-if="this.user.name") 
                svg.icon: use(xlink:href='/icon/sprite.svg#ic_account_circle_white_24px')
                | {{this.user.name}}
            li
              // Sign-in.
              a(href='/users/login' v-if="!this.user.name")
                svg.icon: use(xlink:href='/icon/sprite.svg#ic_account_circle_white_24px')
                | Entrar              
            li
              // Cart.
              a(href='/cart')
                svg.icon: use(xlink:href='/icon/sprite.svg#ic_shopping_cart_white_24px')
                | Carrinho
                | &nbsp              
                span.badge {{ cart.totalQtd }}
            li
              // Admin.
              a(href='/configProducts/store' v-if="this.user.group == 'admin'")
                svg.icon: use(xlink:href='/icon/sprite.svg#ic_supervisor_account_white_24px')
                | Admin
            li
              // Exit.
              a(href='/users/logout' v-if="this.user.name")
                svg.icon: use(xlink:href='/icon/sprite.svg#ic_exit_to_app_white_24px')
                | Sair                
          .navbar-form.navbar-right
            input.form-control(v-model='search' v-on:keyup.enter='getProducts()' placeholder='O que você procura?' type='text' size='40')
    .container
      .row(v-if="this.productAdded")
        .col-md-12
          .cart
            .item
              span.glyphicon.glyphicon-ok
              img(:src='this.productAdded.image')
              span Adicionado ao carrinho
            .sub-total
              span  Subtotal 
              span ({{ cart.totalQtd }} {{cart.totalQtd > 1 ? "itens" : "item"}}): 
              span {{ cart.totalPrice | currencyBr }}
            .buttons
              a.btn.btn-primary(href='/cart') Carrinho
              a.btn.btn-success(href='/checkout/ship-address') Continuar ({{ cart.totalQtd }} {{cart.totalQtd > 1 ? "itens" : "item"}})
      .row(v-for='i in Math.ceil(products.length / colsByRow)')
        //- Must have title and price more than 0 to be show.
        .col-md-3(v-for='product in products.slice((i - 1) * colsByRow, i * colsByRow)')
          .thumbnail
            a.product(:href='"/old/product/" + product._id')
              img(:src='`/img/${product._id}/${product.images[0]}`', v-if='product.images[0]')
              h4.description {{ product.storeProductTitle }}
              h3.price
                sup R$
                | {{ product.storeProductPrice | currencyInt }}
                sup {{ product.storeProductPrice | currencyCents }}
      .row
        .col-md-10.col-md-offset-1
          footer
</template>
<script>
  /* globals accounting */
  'use strict';
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
        // Curret page for pagination.
        page:1,
        // Number of pages for pagination.
        pageCount: 1,
        // Text for search products.
        search: '',
        // Number of cols by rows to show products.
        colsByRow: 4,
        // Products by row.
        productsByRow: []
      }
    },
    props:['$http', 'user', 'cart', 'initSearch', 'productAdded'],
    created() {
      // On reload page use the query string for search, not the input search.
      this.search = this.initSearch;
      this.getProducts();
    },
    methods: {
      // retrive products page
      getProducts(page=1){
        this.$http.get(`/ws/store/products-commercialize/?page=${page}&search=${this.search}`)
          .then((res)=>{
            this.products = res.body.products;
            this.page = res.body.page;
            this.pageCount = res.body.pageCount;
            console.log('products count: ', this.products.length);
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
      }
    },
    filters: {
      currencyBr(value){
        return accounting.formatMoney(value, 'R$ ', 2, '.', ',');
      },
      currencyInt(value){
        return accounting.formatMoney(accounting.parse(value, ','), '', 2, '.', ',').split(',')[0];
      },
      currencyCents(value){
        return accounting.formatMoney(accounting.parse(value, ','), '', 2, '.', ',').split(',')[1];
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
  .cart
    display: table
    height: 4em
    border: 1px solid #ccc
    margin-bottom: 2em
    font-size: 1.2em
    width: 100%
    font-weight: bold
  .cart > .item
  .cart > .sub-total
  .cart > .buttons
    display: table-cell
    vertical-align: middle
  .cart > .sub-total
  .cart > .buttons
    padding-left: 1em
    padding-right: 1em  
    background-color: #f3f3f3
  .cart > .item
    border-right: 1px solid #ccc
    white-space: nowrap
  .cart > .item > span
    padding-left: 1em
    padding-right: 1em
    color: green
  .cart > .item > .glyphicon
    font-size: 1.5em
  .cart > .item > img
    max-height: 4em
  .cart > .sub-total
  .cart > .sub-total > span:nth-child(2)
    font-weight: normal
  .cart > .sub-total > span:nth-child(3)
    color: green
  .cart > .buttons
    text-align: right
  .cart > .buttons > button
    margin: .7em    
  .cart > .buttons > a:nth-child(1)
    margin-right: 1em    
  footer
    height: 50px    
  .icon
    width: 1.5em
    height: 1.5em
    vertical-align: middle
    margin-right: .5em
</style>
