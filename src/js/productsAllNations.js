/* eslint no-unused-vars: off */
'use strict';
// vue
import Vue from 'vue';
import vueResource from 'vue-resource';
Vue.use(vueResource);
// components
import productsAllnations from './productsAllNations.vue';

window.AppVue = new Vue({
  el: '#app',
  data: {
    msg: 'Products All Nations'
  },
  components: {
    productsAllnations
  }
});
