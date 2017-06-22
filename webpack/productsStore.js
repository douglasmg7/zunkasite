/* eslint no-unused-vars: off */
'use strict';

// Vue components.
import productsStore from './productsStore.vue';

// event hub
window.eventHub = new Vue({
});

window.appVue = new Vue({
	el: '#app',
 	render (h) {
 		return h(productsStore, {props: {$http: this.$http}, ref: 'productsStore'});
	}
});
