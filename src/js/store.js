/* eslint no-unused-vars: off */
'use strict';
import Vue from 'vue';
import vueResource from 'vue-resource';
Vue.use(vueResource);
// components
import store from './store.vue';
// event hub
window.eventHub = new Vue({
});

// Using template render.
const app = new Vue({
  render: createEle=>createEle(store),
  data: {
    msg: 'Store'
  },
  components: {
    store
  }
}).$mount('#app');
window.appVue = app;

// // app
// window.appVue = new Vue({
//   el: '#app',
//   data: {
//     msg: 'Store'
//   },
//   components: {
//     store
//   }
// });
