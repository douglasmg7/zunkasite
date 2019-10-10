'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
    el: '#app',
    data: {
        regions: regions
    },
    created() {
    },
    methods: {
        toReal(val) {
            val = (val / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            // numSpaces = 12 - val.length;
            return '&nbsp' + val;
        },
        fromReal(val) {
            // console.log(`type of val: ${typeof val}`);
            // To a valid string number.
            // Regex remove all ',' but the last.
            val = val.replace('.', '').replace(/\,(?=[^,]*\,)/g, '').replace(',', '.');            
            val = parseFloat(val) * 100;
            val = parseInt(val);
            // console.log(`val: ${val}`);
            return val;
        },
        toKg(val) {
            return (val / 1000).toFixed(0);
        },
    },
});
