/* eslint no-unused-vars: off */
'use strict';
import Vue from 'vue';
import vueResource from 'vue-resource';
Vue.use(vueResource);
// components
import login from './login.vue';
// event hub
window.eventHub = new Vue({
});
// app
window.appVue = new Vue({
  el: '#app',
  data: {
    msg: 'Login'
  },
  components: {
    login
  }
});
