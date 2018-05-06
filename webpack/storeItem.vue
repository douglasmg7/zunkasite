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
      .row
        .col-md-4.col-md-offset-1
          .row
            .col-md-12
              img.img-responsive.center-block(:src='`/img/${product._id}/${product.images[selectedThumbnail]}`' v-if='product.images.length > 0')
          .row(v-for='(r, index) in new Array(colsByRow)')
            .col-md-3(v-for='(i, index2) in imagesSelectedByRow[index]')
              img.img-responsive(:src='`/img/${product._id}/${product.images[index * colsByRow + index2]}`' @click='selectedThumbnail=index * colsByRow + index2')
        .col-md-6
          // Title.
          h3.product-name {{product.storeProductTitle}}
          // Price
          h3.product-price(v-if='accountingParse(this.product.storeProductPrice, ",") > 0') {{ product.storeProductPrice | currencyBr}}
          // Detail.
          ul.product-detail(v-if='productDetail.length > 0')
            li(v-for='detail in productDetail') {{detail}}
          button.btn.btn-success.add-cart(@click='addToCart') Adicionar ao carrinho
          .estimateShip
            p Estimar frete e prazo (Entre com o CEP)
            form.form-inline(id='form-ship' action='EstimateShip')
              input(type='hidden' name='_csrf' value=csrfToken)       
              .input-group
                input.form-control(type='text' id='cep' size='7')
                span.input-group-btn
                  button.btn.btn-default.cep 
                    span.loader
                    span.loader-text Calcular
              p.cep-error-msg
            table.estimate-ship
              thead
                tr
                  th Entrega
                  th Frete
                  th Prazo
              tbody
                tr
                  td -
                  td -
                  td -
                //- Label(type='text' for='cep') CEP
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
                table.table.information
                  tbody
                    tr(v-for='infoTech in productInformationTechnical')
                      td {{infoTech[0]}}
                      td {{infoTech[1]}}
            //- Additional information.
            .col-md-6(v-if='productInformationAdditional.length > 0')
              h5 Informações adicionais
              .table-responsive
                table.table.information
                  tbody
                    tr(v-for='infoAdd in productInformationAdditional')
                      td {{infoAdd[0]}}
                      td {{infoAdd[1]}}
      .row
        .col-md-10.col-md-offset-1
          footer
</template>
<script>
  jQuery(function($){
    // $('button.cep').find('.loader').hide();
    $('.estimate-ship').hide();
    $('#form-ship').find('.cep-error-msg').hide();
    // Maskedinput.
    $('#cep').mask('99999-999');
    $('#form-ship').submit(function(e){
      let $table = $('.estimate-ship');
      let $td = $table.find('td');
      let $errMsg = $('.cep-error-msg');
      $errMsg.hide();
      $td.eq(0).html('-');
      $td.eq(1).html('-');
      $td.eq(2).html('-');
      let $btn = $(this).find('button');
      $btn.find('.loader').css('display', 'inline-block');
      $btn.find('.loader-text').html('Calculando');
      $.ajax({
        method: 'GET',
        url: '/checkout/ship-estimate/',
        data: { _csrf: '#{csrfToken}', productId: appVue.$refs.storeItem.product._id, cepDestiny: $('#cep').val()}
      })
      .done(function(result){
        console.log(result);
        // console.log(result.correio);
        // console.log(result.correio.Valor);
        if (result.success) {
          $errMsg.hide();
          $td.eq(0).html('Ecônomica');
          $td.eq(1).html(result.correio.Valor);
          $td.eq(2).html(`${result.correio.PrazoEntrega} dia(s)`);
          $table.show();
        } else {
          $errMsg.html(result.errMsg).show();
        }
        $btn.find('.loader').css('display', 'none');
        $btn.find('.loader-text').html('Calcular');
      });        
      return false;
    })
  });
  /* globals accounting */
  'use strict';
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
    props:['$http', 'user', 'product', 'cart', 'csrfToken'],
    created(){
      let numRows = Math.ceil(this.product.images.length / this.colsByRow);
      // Create um array for each row.
      for (var i = 0; i < numRows; i++) {
        this.imagesSelectedByRow.push(new Array());
      }
      // Fill each array with images.
      for (var i=0 ; i < this.product.images.length; i++) {
        this.imagesSelectedByRow[Math.floor(i/this.colsByRow)].push(this.product.images[i]);
      }
    },
    methods: {
      // Accaunting.
      accountingParse: accounting.parse,
      // Retrive products page.
      getProducts(page=1){
        window.location.href = `/?page=1&search=${this.search}`;
      },
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
  table.information td:nth-child(1)
    background-color: #F3F3F3
  table.estimate-ship
    margin-top: 1em
    border-radius: 4px
    background-color: #F3F3F3
  table.estimate-ship th
    padding: .5em 1em 0 1em
  table.estimate-ship td
    padding: .5em 1em .5em 1em
  footer
    height: 50px
  button.add-cart
    margin-top: 1em
    // margin-left: 1em
  .estimateShip
    margin-top: 2em;
  .estimateShip > p 
    font-weight: bold
  table.estimate-ship
    display: none;
  .icon
    width: 1.5em
    height: 1.5em
    vertical-align: middle
    margin-right: .5em
  .loader
    display: none;
    vertical-align: middle;
    margin-right: .5em
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db
    border-radius: 50%
    width: 1.4em
    height: 1.4em
    animation: spin 2s linear infinite
  @keyframes spin
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  .cep-error-msg
    margin-top: .5em;
    color: red;
</style>
