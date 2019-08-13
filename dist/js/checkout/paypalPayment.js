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


// Paste from doc example.
if (window.addEventListener) {
    window.addEventListener("message", receiveMessage, false);
    console.log("addEventListener successful", "debug");
} else if (window.attachEvent) {
    window.attachEvent("onmessage", receiveMessage);
    console.log("attachEvent successful", "debug");
} else {
    console.log("Could not attach message listener", "debug");
    throw new Error("Can't attach message listener");
}

function receiveMessage(event) {
    try {
        var message = JSON.parse(event.data);
        if (typeof message['cause'] !== 'undefined') { //iFrame error handling
            ppplusError = message['cause'].replace (/['"]+/g,""); //log & attach this error into the order if possible
			// <<Insert Code Here>>
            switch (ppplusError)
                {
                    case "INTERNAL_SERVICE_ERROR": //javascript fallthrough
                    case "SOCKET_HANG_UP": //javascript fallthrough
                    case "socket hang up": //javascript fallthrough
                    case "connect ECONNREFUSED": //javascript fallthrough
                    case "connect ETIMEDOUT": //javascript fallthrough
                    case "UNKNOWN_INTERNAL_ERROR": //javascript fallthrough
                    case "fiWalletLifecycle_unknown_error": //javascript fallthrough
                    case "Failed to decrypt term info": //javascript fallthrough
                    case "RESOURCE_NOT_FOUND": //javascript fallthrough
                    case "INTERNAL_SERVER_ERROR": 
                    alert ("Ocorreu um erro inesperado, por favor tente novamente. (" + ppplusError + ")"); //pt_BR
                    //Generic error, inform the customer to try again; generate a new approval_url and reload the iFrame.
                    // <<Insert Code Here>>
                    break;

                    case "RISK_N_DECLINE": //javascript fallthrough
                    case "NO_VALID_FUNDING_SOURCE_OR_RISK_REFUSED": //javascript fallthrough
                    case "TRY_ANOTHER_CARD": //javascript fallthrough
                    case "NO_VALID_FUNDING_INSTRUMENT":
                    alert ("Seu pagamento não foi aprovado. Por favor utilize outro cartão, caso o problema persista entre em contato com o PayPal (0800-047-4482). (" + ppplusError + ")"); //pt_BR
                    //Risk denial, inform the customer to try again; generate a new approval_url and reload the iFrame.
                    // <<Insert Code Here>>
                    break;

                    case "CARD_ATTEMPT_INVALID":
                    alert ("Ocorreu um erro inesperado, por favor tente novamente. (" + ppplusError + ")"); //pt_BR
                    //03 maximum payment attempts with error, inform the customer to try again; generate a new approval_url and reload the iFrame.
                    // <<Insert Code Here>>
                    break;

                    case "INVALID_OR_EXPIRED_TOKEN":
                    alert ("A sua sessão expirou, por favor tente novamente. (" + ppplusError + ")"); //pt_BR
                    //User session is expired, inform the customer to try again; generate a new approval_url and reload the iFrame.
                    // <<Insert Code Here>>
                    break;

                    case "CHECK_ENTRY":  
                    alert ("Por favor revise os dados de Cartão de Crédito inseridos. (" + ppplusError + ")"); //pt_BR
                    //Missing or invalid credit card information, inform your customer to check the inputs.
                    // <<Insert Code Here>>
                    break;
                    
                    default:  //unknown error & reload payment flow
                    alert ("Ocorreu um erro inesperado, por favor tente novamente. (" + ppplusError + ")"); //pt_BR
                    //Generic error, inform the customer to try again; generate a new approval_url and reload the iFrame.
                    // <<Insert Code Here>>
                }
        }
        if (message['action'] == 'checkout') { //PPPlus session approved, do logic here
        	var rememberedCard = null;
            var payerID = null;
            var installmentsValue= null;

            rememberedCard = message['result']['rememberedCards']; //save on user BD record
            payerID = message['result']['payer']['payer_info']['payer_id']; //use it on executePayment API
            
            if(message['result']['term']['term']){
                installmentsValue = message['result']['term']['term']; //installments value
            } else {
                installmentsValue=1; //no installments
            }
            /* Next steps:
            console.log (rememberedCard);
            console.log (payerID);
            console.log (installmentsValue);
                1) Save the rememberedCard value on the user record on your Database.
                2) Save the installmentsValue value into the order (Optional).
                3) Call executePayment API using payerID value to capture the payment.
            */
            // <<Insert Code Here>>
        }
    } catch (e){ //treat exceptions here
    	// <<Insert Code Here>>
    }

}

function ec(){
	console.log("enableContinue was called.");
}

function dc(){
	console.log("disableContinue was called.");
}

// Url for paypal approval payment.
let urlAproval;
order.payment.paypalPaymentRequestResult.links.forEach(item=>{
	if (item.rel == "approval_url") {
		urlAproval = item.href;
		return;
	}
});
// console.log(`approvalURL: ${urlAproval}`);

// Paypal script.
// todo - config to use mode production.
let ppp = PAYPAL.apps.PPP({ 
	approvalUrl: urlAproval,
	placeholder: "ppplus",
	mode: "sandbox",
	payerFirstName: "Sérgio",
	payerLastName: "Miranda",
	payerEmail: "douglasmg@gmail.com",
	payerPhone: "31998830334",
	payerTaxId: "02806376670",
	payerTaxIdType: "BR_CPF",	// BR_CNPJ
	language: "pt_BR",
	country: "BR",
	enableContinue: "continueButton",
	disableContinue: "continueButton"

	// enableContinue: ec,
	// disableContinue: dc

	// 4devs.com Gerar cpf.
	// payerFirstName: "Sérgio",	// This name must match the name on the credit card.
	// payerLastName: "Miranda",	// This name must match the name on the credit card.
	// approvalUrl: urlAproval,
});
