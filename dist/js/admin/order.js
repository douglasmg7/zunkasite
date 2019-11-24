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
		// Window to change status.
		setStatusWindow: {
			show: false,
			message: '',
			showCheckboxUpdateStock: false,
			// Change to this status.
			status: '',
			// Update stock quantity when intem is canceled.
			updateStock: false,
		},
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
             let verifyDeliveryAction = { id: 'verifyDelivery', text: 'Verificar se o pedido foi entrege' };
		     let sendAction = { id: 'send', text: 'Pedido deve ser enviado' };
			 let verifyPaymentAction = { id: 'verifyPayment', text: 'Verificar se o pedido foi pago' };
			 let voidAction = { id: '', text: '' };
			 let errorAction = { id: 'err', text: 'Erro - sem ação definida' };
			switch(order.status) {
				case 'canceled':
				case 'delivered':
				    return voidAction;
			}
			// Money, only by motoboy.
			if(order.payment.method === 'money'){
				switch(order.status) {
					case 'shipped':
					    return verifyDeliveryAction;
					case 'paid':
					    return { id: 'paid', text: 'Pedido foi pago' };
					case 'placed':
					    return sendAction;
					default:
					    return voidAction;
				}
			} 
			else if(order.payment.method === 'transfer'){
				switch(order.status) {
					case 'shipped':
					    return verifyDeliveryAction;
					case 'paid':
					    return sendAction;
					case 'placed':
					    return verifyPaymentAction;
					default:
					    return voidAction;
				}
			}
			else if (order.payment.method === 'paypal' || order.payment.method === undefined) {
				switch(order.status) {
					case 'shipped':
					    return verifyDeliveryAction;
					case 'paid':
					    return sendAction;
					case 'placed':
                        return errorAction
					default:
					    return voidAction;
				}
			} 
			else if (order.payment.method === 'ppp-credit') {
				switch(order.status) {
					case 'shipped':
					    return verifyDeliveryAction;
					case 'paid':
					    return sendAction;
					case 'placed':
					    return verifyPaymentAction;
					default:
						return '';
				}
			} 
		},    
		// Set order status from selected order.
		showSetStatusWindow(status){
			// Status to change.
			this.setStatusWindow.status = status;
			// Config window.
			switch (status){
				case 'paid':
					this.setStatusWindow.message = 'Pedido foi pago?';
					this.setStatusWindow.showCheckboxUpdateStock = false;
					this.setStatusWindow.show = true;
					break;
				case 'shipped':
					this.setStatusWindow.message = 'Pedido foi enviado?';
					this.setStatusWindow.showCheckboxUpdateStock = false;
					this.setStatusWindow.show = true;
					break;
				case 'delivered':
					this.setStatusWindow.message = 'Pedido foi entregue?';
					this.setStatusWindow.showCheckboxUpdateStock = false;
					this.setStatusWindow.show = true;
					break;
				case 'canceled':
					console.debug('canceled hit');
					this.setStatusWindow.message = 'Cancelar pedido?';
					this.setStatusWindow.showCheckboxUpdateStock = true;
					this.setStatusWindow.updateStock = true;
					this.setStatusWindow.show = true;
					break;
				default:
					return;
			}
		},
		// Set order status from selected order.
		setStatus(){
			axios({
				method: 'post',
				url: `/admin/api/order/status/${this.order._id}/${this.setStatusWindow.status}`,
				headers:{'csrf-token' : csrfToken},
				params: {updateStock: this.setStatusWindow.updateStock}
			})
			.then((res)=>{
				// Update selected order and orders.
				// console.log(`data: ${JSON.stringify(res.data)}`);
				this.order = res.data.order;
				this.setStatusWindow.show = false;
			})
			.catch((err)=>{
				console.error(`Error - setStatus(), err: ${err}`);
				this.setStatusWindow.show = false;
			});
		},
		verifyPaymentCompleted(order){
			let button = document.getElementById('verify-payment-completed');
			button.value = 'processando';
			axios.get(`/checkout/ppp/payment/complete/${order._id}`, { headers: {'csrf-token' : csrfToken} })
			.then((response)=>{
				if (!response.data.success) {
					button.value = 'Verificar se pagamento foi realizado';
					return alert('Erro ao tentar atualizar o status do pagamento.');
				}
				if (response.data.completed) {
					order.status = 'paid';
					button.value = 'Verificar se pagamento foi realizado';
					return alert('Pagamento liberado.');
				}
				button.value = 'Verificar se pagamento foi realizado';
				return alert('Pagamento não liberado ainda.');
			})
			.catch((err)=>{
				button.value = 'Verificar se pagamento foi realizado';
				alert('Erro ao tentar atualizar o status do pagamento.\n' + err.message);
			});
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
