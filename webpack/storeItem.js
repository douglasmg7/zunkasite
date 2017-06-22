/* eslint no-unused-vars: off */
'use strict';

// Vue components
import storeItem from './storeItem.vue';

// event hub
window.eventHub = new Vue({
});

window.appVue = new Vue({
  el: '#app',
  render(h) {
    return h(StoreItem, {props: 
      {
        $http: this.$http,
        product: product
      }
    });
  }
});