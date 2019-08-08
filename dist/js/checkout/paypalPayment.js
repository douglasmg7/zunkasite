'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
let app = new Vue({
	el: '#app',
	data: {
		order: order
	},
	created() {
		// console.log(`env: ${env}`);
	},
	methods: {
		// Close de order.
		confirmPayment(payment){
			axios({
				method: 'post',
				// url: `/checkout/payment/paypal/${order._id}`,
				url: window.location.href,
				headers:{'csrf-token' : csrfToken},
				data: { payment: payment },
				params: { method: 'paypal'}
			})
				.then(response => {
					// Correio answer.
					if (response.data.err) {
						console.log(response.data.err);
					} else {
						window.location.href = `/checkout/order-confirmation/${order._id}`;
					}
				})
				.catch(err => {
					console.error(err);
				}); 
		},
		// Close de order.
		closeOrder(method){
			axios({
				method: 'post',
				url: window.location.href,
				headers:{'csrf-token' : csrfToken},
				params: { method: method}
			})
				.then(response => {
					// Correio answer.
					if (response.data.err) {
						console.log(response.data.err);
					} else {
						window.location.href = `/checkout/order-confirmation/${order._id}`;
					}
				})
				.catch(err => {
					console.error(err);
				}); 
		},
		// Process order by paypal rest api.
		PaymentByPaypalRestApi(){
			axios({
				method: 'post',
				url: `/checkout/paypal/create-payment/${order._id}`,
				headers:{'csrf-token' : csrfToken},
			})
				.then(response => {
					// Correio answer.
					if (response.data.err) {
						console.log(response.data.err);
					} else {
						console.log(JSON.stringify(response.data, null, 2));
						if (response.data.success) {
							console.log("Success.");
						}
						else {
							window.location.href = `/error`;
							// window.location.href = `/checkout/order-confirmation/${order._id}`
						}
					}
				})
				.catch(err => {
					console.error(err);
				}); 
		},
	},
	filters: {
		formatMoney: function(val){
			return 'R$ ' + val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		}
	}  
});

// Url for paypal approval payment.
let urlAproval;
order.payment.paypalPaymentRequestResult.links.forEach(item=>{
	if (item.rel == "approval_url") {
		urlAproval = item.href;
		return;
	}
});
console.log(urlAproval);

// Paypal script.
// todo - config to use mode production.
let ppp = PAYPAL.apps.PPP({ 
	payerEmail: "douglasmg@gmail.com",
	payerFirstName: "Sérgio",	// This name must match the name on the credit card.
	payerLastName: "Miranda",	// This name must match the name on the credit card.
	payerTaxId: "",
	approvalUrl: urlAproval,
	placeholder: "ppplus",
	mode: "sandbox"
});

console.log("End");
