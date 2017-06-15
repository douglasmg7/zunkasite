/* eslint no-unused-vars: off */
'use strict';
import Vue from 'vue';
import vueResource from 'vue-resource';
Vue.use(vueResource);
// components
import signUp from './signUp.vue';
// event hub
window.eventHub = new Vue({
});

// Using template render.
const app = new Vue({
  render: createEle=>createEle(signUp),
  data: {
    msg: 'SignUp'
  },
  components: {
    signUp
  }
}).$mount('#app');
window.appVue = app;

// // app
// window.appVue = new Vue({
//   el: '#app',
//   data: {
//     msg: 'SignUp'
//   },
//   components: {
//     signUp
//   }
// });
