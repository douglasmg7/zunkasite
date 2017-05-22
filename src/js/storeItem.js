/* eslint no-unused-vars: off */
'use strict';
import Vue from 'vue';
import vueResource from 'vue-resource';
Vue.use(vueResource);
// components
import storeItem from './storeItem.vue';
// event hub
window.eventHub = new Vue({
});
// app
window.appVue = new Vue({
  el: '#app',
  data: {
    msg: 'StoreItem'
  },
  components: {
    storeItem
  }
});
