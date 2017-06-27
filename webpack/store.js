/* eslint no-unused-vars: off */
'use strict';

// Vue component.
import Store from './store.vue';

// event hub
window.eventHub = new Vue({
});

// Using template render.
window.appVue = new Vue({
  el: '#app',
  render(h) {
    return h(Store, {props: 
      {
        $http: this.$http,
        user: vueUser,
        initSearch: vueInitSearch
      }
    });
  },
  created() {
    // this.$http.get('http://httpbin.org/ip').then(function ({data}) {
    //   console.log(data)
    // });    
  }
});
