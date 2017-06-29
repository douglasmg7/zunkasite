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
              a Carrinho
            li
              // Config.
              a(href='/configProducts/store' v-if="this.user.group == 'admin'") Config
            li
              // Exit.
              a(href='/users/logout' v-if="this.user.username") Sair
          form.navbar-form.navbar-right
            input.form-control(v-model='search' v-on:keyup.enter='getProducts()' placeholder='O que você procura?' type='text' size='40')
    .container
      .row
        .col-md-2
        .col-md-8
          .image
            img(:src='imgUrl()')
          .content
            // Title.
            h3 Raspberry PI 3 Model B A1.2GHz 64-bit quad-core ARMv8 CPU, 1GB RAM
            // Price
            h2.product-price
              sup R$
              | {{product.storeProductPrice | currencyInt}}
              sup {{product.storeProductPrice | currencyCents}}
            // List of caracteristics.
            .product-detail
              ul
                li 1.2GHz 64-bit quad-core ARMv8 CPU, 1 GB RAM
                li 802.11n Wireless LAN, 10/100Mbps Lan Speed 
                li Bluetooth 4.1, Bluetooth Low Energy 
                li 4 USB ports, 40 GPIO pins, Full HDMI port, Combined 3.5mm audio jack and composite video 
                li Camera interface (CSI),Display interface (DSI), Micro SD card slot (now push-pull rather than push-push), VideoCore IV 3D graphics core
            // Complete description.
            .product-description
              h3 Descricao do produto
              p Built on the latest Broadcom 2837 ARMv8 64 bit processor the Raspberry Pi 3 Model B is faster and more powerful than its predecessors. It has improved power management to support more powerful external USB devices and now comes with built-in wireless and Bluetooth connectivity. To take full advantage of the improved power management on the Raspberry Pi 3 and provide support for even more powerful devices on the USB ports, a 2.5A adapter is required. Technical Specifications: - Broadcom BCM2837 64bit ARMv8 QUAD Core 64bit Processor powered Single Board Computer running at 1.2GHz - 1GB RAM - BCM43143 WiFi on board - Bluetooth Low Energy (BLE) on board - 40pin extended GPIO - 4 x USB2 ports - 4 pole Stereo output and Composite video port - Full size HDMI - CSI camera port for connecting the Raspberry Pi camera - DSI display port for connecting the Raspberry Pi touch screen display - MicroSD port for loading your operating system and storing data - Upgraded switched Micro USB power source (now supports up to 2.5 Amps) This product is made under license in both China and the U.K. Please see the product packaging.
            // Table of information.
            .product-information
              h3 Informacao do produto
              .techincal
                h4 Detalhe tecnico
                .table-responsive
                  table.table.table-striped
                    tbody
                      tr
                        td Screen Size 
                        td 60 inches 
                      tr
                        td Processor 
                        td 1.2 GHz 
              .additional
                h4 Informacoes adicionais
                .table-responsive
                  table.table.table-striped
                    tbody
                      tr
                        td Brand Name 
                        td Raspberry Pi 
                      tr
                        td Series 
                        td RASPBERRYPI3-MODB-1GB
        .col-md-2
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
