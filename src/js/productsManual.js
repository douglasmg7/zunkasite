/* eslint no-unused-vars: off */
'use strict';
// vue
import Vue from 'vue';
import vueResource from 'vue-resource';
Vue.use(vueResource);
// components
import productsManual from './productsManual.vue';

// Using template render.
window.appVue = new Vue({
	el: '#app',
 	render(h) {
  	return h(productsManual)
  },
  data() {
  	return {
	    msg: 'Products Manual'
  	}
  }
});
