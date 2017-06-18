/* eslint no-unused-vars: off */
'use strict';
import Vue from 'vue';
import vueResource from 'vue-resource';
Vue.use(vueResource);
// components
import Store from './store.vue';
// event hub
window.eventHub = new Vue({
});

// Using template render.
window.appVue = new Vue({
  el: '#app',
  render(h) {
    return h(Store, {props: {username: window.renderData.username, initSearch: window.renderData.initSearch}});
  },
  data() {
    return {
      msg: {username: 'Catarine'}
    };
  },
  created() {
  }
});
