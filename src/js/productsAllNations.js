/* eslint no-unused-vars: off */
'use strict';
// vue
import Vue from 'vue';
import vueResource from 'vue-resource';
Vue.use(vueResource);
// components
import productsAllnations from './productsAllNations.vue';

// Using template render.
const app = new Vue({
  render: createEle=>createEle(productsAllnations),
  data: {
    msg: 'Products All Nations'
  },
  components: {
    productsAllnations
  }
}).$mount('#app');
window.appVue = app;

// // app
// window.AppVue = new Vue({
//   el: '#app',
//   data: {
//     msg: 'Products All Nations'
//   },
//   components: {
//     productsAllnations
//   }
// });
