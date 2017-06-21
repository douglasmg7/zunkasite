import Store from './store.vue';
import vueResource from 'vue-resource';
/* eslint no-unused-vars: off */
'use strict';
// import Vue from 'vue';
Vue.use(vueResource);
// components
// event hub
window.eventHub = new Vue({
});

console.log('init store.js');
// Using template render.
window.appVue = new Vue({
  el: '#app',
  render(h) {
    return h(Store, {props: 
      {
        username: window.renderData.username, 
        initSearch: window.renderData.initSearch,
        group: window.renderData.group
      }
    });
  },
  data() {
    return {
      msg: {username: 'Catarine'}
    };
  },
  created() {
  }
});
