/* eslint no-unused-vars: off */
'use strict';

// Vue component.
import Store from '../../src/js/store.vue';

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
    // this.$http.get('http://httpbin.org/ip').then(function ({data}) {
    //   console.log(data)
    // });    
  }
});
