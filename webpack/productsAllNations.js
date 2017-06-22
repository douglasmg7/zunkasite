/* eslint no-unused-vars: off */
'use strict';

// Vue components.
import productsAllnations from './productsAllNations.vue';

// Using template render.
window.appVue = new Vue({
  el: '#app',
  render(h) {
    return h(productsAllnations);
  }
});
