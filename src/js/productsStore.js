/* eslint no-unused-vars: off */
'use strict';
// require ('../../semantic/dist/semantic.min.css');
// require ('../../dist/css/pStore.css');
// let $ = require('jquery');
// require('../../semantic/dist/semantic.min.js');
import Vue from 'vue';
import vueResource from 'vue-resource';
Vue.use(vueResource);
// components
import productsStore from './productsStore.vue';
// event hub
window.eventHub = new Vue({
});
// app
window.appVue = new Vue({
  el: '#app',
  data: {
    msg: 'Products Store'
  },
  components: {
    productsStore
  }
});
