'use strict';

// Brasilian months names.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
    el: '#app',
    data: {
        user: userInfo,
        orders: orders,
    },
    methods: {
        placedAt: function(order) {
            return moment(order.timestamps.placedAt).tz('America/Sao_Paulo').format('DD-MMM-YYYY  HH:mm Z')
            // Order not placed.
            if (!order.timestamps.placedAt){
                return moment(order.timestamps.shippingAddressSelectedAt).tz('America/Sao_Paulo').format('DD-MMM-YYYY  HH:mm') + ' (não concluído)' }
            else
            {
                return moment(order.timestamps.placedAt).tz('America/Sao_Paulo').format('DD-MMM-YYYY  HH:mm Z')
            }
        }
    },
	filters: {
		// Format number to money format.
		formatMoney(val){
            if (!val) {
                return ""
            }
			return 'R$ ' + val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		},
		// Format number to money format.
		formatDate(val){
            let d;
            if (val) {
			    d = new Date(val);
            } else {
                d = new Date(); 
            }
            // Set to brazilian zone.
            d.setHours(d.getHours() - 3);
			return `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}-${d.getUTCFullYear()} ${d.getUTCHours()}:${d.getUTCMinutes()}`;
		}
	}
});
