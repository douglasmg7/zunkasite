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
          form.navbar-form.navbar-right
            input.form-control(v-model='search' v-on:keyup.enter='getProducts()' placeholder='O que você procura?' type='text' size='40')
    .container
      .row
        .col-md-4.col-md-offset-1
          .row
            .col-md-12
              img.img-responsive.center-block(:src='getImgUrl(0)' v-if='imagesSelected.length > 0')
          .row
            .col-md-2
              img.img-responsive.center-block(:src='getImgUrl(0)' v-if='imagesSelected.length > 0')
            .col-md-2
              img.img-responsive.center-block(:src='getImgUrl(1)' v-if='imagesSelected.length > 1')
            .col-md-2
              img.img-responsive.center-block(:src='getImgUrl(2)' v-if='imagesSelected.length > 2') 
            .col-md-2
              img.img-responsive.center-block(:src='getImgUrl(3)' v-if='imagesSelected.length > 3')
            .col-md-2
              img.img-responsive.center-block(:src='getImgUrl(4)' v-if='imagesSelected.length > 4')
            .col-md-2
              img.img-responsive.center-block(:src='getImgUrl(5)' v-if='imagesSelected.length > 5')
        .col-md-6
          // Title.
          h3.product-name {{product.storeProductTitle}}
          // Price
          h3.product-price {{product.storeProductPrice | currencyBr}}
          // Detail.
          ul.product-detail
            li(v-for='detail in productDetail') {{detail}}
      .row
        .col-md-10.col-md-offset-1
          //- Description.
          hr
          h5.title Descricao do produto
          p {{product.storeProductDescription}}
      .row
        .col-md-10.col-md-offset-1
          //- Informations.
          hr
          h5.title Informacao do produto
          .row
            //- Technical information.
            .col-md-6
              h5 Detalhe tecnico
              .table-responsive
                table.table
                  tbody
                    tr(v-for='infoTech in productInformationTechnical')
                      td {{infoTech[0]}}
                      td {{infoTech[1]}}
            //- Additional information.
            .col-md-6
              h5 Informacoes adicionais
              .table-responsive
                table.table
                  tbody
                    tr(v-for='infoAdd in productInformationAdditional')
                      td {{infoAdd[0]}}
                      td {{infoAdd[1]}}
      .row
        .col-md-10.col-md-offset-1
          footer
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
        search: '',
        imageUrls: []
      }
    },
    props:['$http', 'user', 'product'],
    created(){
      // this.getImagesUrl(this.product);
    },
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
      // Get image url.
      getImgUrl(index){
        return `/img/${this.product._id}/${this.imagesSelected[index].name}`;
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
    computed:{
      // Return array with only images marked as selected.
      imagesSelected(){
        let imgSel = [];
        this.product.images.forEach(function(image) {
          if (image.selected) {
            imgSel.push(image);
          }
        });
        return imgSel;
      },
      // Each line of product detail become one array item.
      productDetail(){
        return this.product.storeProductDetail.split('\n');
      },
      // Each line of technical information become a array item, each item in line separeted by ; become array item.
      productInformationTechnical(){
        let infoTech = [];
        this.product.storeProductTechnicalInformation.split('\n').forEach(function(info) {
          infoTech.push(info.split(';'));
        });
        return infoTech;
      },
      // Each line of additional information become a array item, each item in line separeted by ; become array item.
      productInformationAdditional(){
        let infoAdd = [];
        this.product.storeProductAdditionalInformation.split('\n').forEach(function(info) {
          infoAdd.push(info.split(';'));
        });
        return infoAdd;
      }
    }    
  }
</script>
<style lang='stylus'>
  .title
    color: green
    font-weight: bold
  .product-name
  .product-price
    color: black
  .product-detail
    padding-top: 1em
    padding-left: 1em
  img
    padding-top: 2em
  td:nth-child(1)
    background-color: #F3F3F3
  footer
    height: 50px
</style>
