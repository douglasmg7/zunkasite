'use strict';

'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
    el: '#app',
    data: {
    },
    // methods: {
        // // Set default address.
        // remove(){
            // this.warnMessage = '';
            // let headers = { 'csrf-token': csrfToken };
            // axios.delete(`/admin/shipping/price/${this.shippingPrice._id}`, { headers: headers })
            // .then(()=>{
                // window.location.href = '/admin/shipping/prices';
            // })
            // .catch((err)=>{
                // // System internal error.
                // if (err.response.status == 500) {
                    // this.warnMessage = 'Alguma coisa deu errada :(';
                // } 
                // // Invalid form data.
                // else if (err.response.status = 422) {
                    // console.log(JSON.stringify(err.response.data.erros[0], null, 2));
                    // this.warnMessage = err.response.data.erros[0].msg;
                // }
                // else {
                    // console.error(`delete(). ${JSON.stringify(err, null, 2)}`);
                // }
            // });
        // }
    // },
});
