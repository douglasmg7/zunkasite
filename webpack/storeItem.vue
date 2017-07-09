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
        .col-md-4.col-md-offset-1
          .row
            .col-md-12
              img.img-responsive.center-block(:src='getImgUrl(selectedThumbnail)' v-if='imagesSelected.length > 0')
          .row(v-for='(r, index) in new Array(colsByRow)')
            .col-md-3(v-for='(i, index2) in imagesSelectedByRow[index]')
              img.img-responsive(:src='getImgUrl(index * colsByRow + index2)' @click='selectedThumbnail=index * colsByRow + index2')
        .col-md-6
          // Title.
          h3.product-name {{product.storeProductTitle}}
          // Price
          h3.product-price(v-if='this.product.storeProductPrice.toString().replace(",", ".") > 0') {{formatProdcutPrice() | currencyBr}}
          // Detail.
          ul.product-detail(v-if='productDetail.length > 0')
            li(v-for='detail in productDetail') {{detail}}
      .row(v-if='product.storeProductDescription.trim() !== ""')
        .col-md-10.col-md-offset-1
          //- Description.
          hr
          h5.title Descrição do produto
          p {{product.storeProductDescription}}
      .row(v-if='productInformationTechnical.length > 0 || productInformationAdditional.length > 0')
        .col-md-10.col-md-offset-1
          //- Informations.
          hr
          h5.title Informação do produto
          .row
            //- Technical information.
            .col-md-6(v-if='productInformationTechnical.length > 0')
              h5 Detalhe técnico
              .table-responsive
                table.table
                  tbody
                    tr(v-for='infoTech in productInformationTechnical')
                      td {{infoTech[0]}}
                      td {{infoTech[1]}}
            //- Additional information.
            .col-md-6(v-if='productInformationAdditional.length > 0')
              h5 Informações adicionais
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
        selectedThumbnail: 0,
        colsByRow: 4,
        imagesSelectedByRow: []
      }
    },
    props:['$http', 'user', 'product'],
    created(){
      let numRows = Math.ceil(this.imagesSelected.length / this.colsByRow);
      // Create um array for each row.
      for (var i = 0; i < numRows; i++) {
        this.imagesSelectedByRow.push(new Array());
      }
      // Fill each array with images.
      for (var i=0 ; i < this.imagesSelected.length; i++) {
        this.imagesSelectedByRow[Math.floor(i/this.colsByRow)].push(this.imagesSelected[i]);
      }
    },
    methods: {
      // Retrive products page.
      getProducts(page=1){
        window.location.href = `/?page=1&search=${this.search}`;
      },
      // Get image url.
      getImgUrl(index){
        return `/img/${this.product._id}/${this.imagesSelected[index].name}`;
      },
      formatProdcutPrice(){
        console.log(`price: '${this.product.storeProductPrice}'`);
        return this.product.storeProductPrice.toString().replace(',', '.');
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
