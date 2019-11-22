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
        order: order,
    },
    methods: {
		// Get status order.
		status(order){
			switch(order.status) {
				case 'canceled':
					return 'cancelado';
				case 'delivered':
					return 'entregue';
				case 'shipped':
					return 'enviado';
				case 'paid':
					return 'pago';
				case 'placed':
					return 'aberto';
				default:
					return '';
			}
		},
		// Get order action.
		action(order){
			switch(order.status) {
				case 'canceled':
					return '';
				case 'delivered':
					return '';
			}
			// Money, only by motoboy.
			if(order.payment.method === 'money'){
				switch(order.status) {
					case 'shipped':
						return '';
					case 'paid':
						return 'Pago';
					case 'placed':
						return 'Enviar';
					default:
						return '';
				}
			} 
			else if(order.payment.method === 'transfer'){
				switch(order.status) {
					case 'shipped':
						return '';
					case 'paid':
						return 'Enviar';
					case 'placed':
						return 'Verificar pagamento';
					default:
						return '';
				}
			}
			else if (order.payment.method === 'paypal' || order.payment.method === undefined) {
				switch(order.status) {
					case 'shipped':
						return '';
					case 'paid':
						return 'Enviar';
					case 'placed':
						return 'Erro';
					default:
						return '';
				}
			} 
			else if (order.payment.method === 'ppp-credit') {
				switch(order.status) {
					case 'shipped':
						return '';
					case 'paid':
						return 'Enviar';
					case 'placed':
						return 'Verificar pagamento';
					default:
						return '';
				}
			} 
		},    

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
			// return `${('0' + d.getUTCDate()).slice(-2)}-${MONTHS[d.getUTCMonth()]}-${d.getUTCFullYear()} ${('0' + d.getUTCHours()).slice(-2)}:${('0' + d.getUTCMinutes()).slice(-2)}`;
			return `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}-${d.getUTCFullYear()} ${('0' + d.getUTCHours()).slice(-2)}:${('0' + d.getUTCMinutes()).slice(-2)}`;
		},
        addS(qtd) {
            if (qtd > 1) {
                return 's';
            }
            return '';
        }
	}
});
