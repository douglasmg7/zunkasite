'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Reload when browser history back.
if(performance.navigation.type == 2){
    location.reload(true);
}

// Vue.
let app = new Vue({
	el: '#app',
	data: {
		order: order
	},
	methods: {
		// Execute payment.
		savePPPApprovalPayment(pppApprovalPayment){
			axios({
				method: 'post',
				url: `/checkout/ppp/payment/approval/${order._id}`,
				headers:{'csrf-token' : csrfToken},
				data: { pppApprovalPayment: pppApprovalPayment },
				// params: { method: 'paypal'}
			})
			.then(response => {
				if (response.data.err) {
					console.log(response.data.err);
					window.location.href = `/error`;
				} else {
					// console.log(response.data);
					window.location.href = `/checkout/review/order/${order._id}`;
				}
			})
			.catch(err => {
				console.error(err);
				window.location.href = `/error`;
			}); 
		},
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

// Treat ppp approval message.
function receiveMessage(event) {
    try {
		// Don't process vue messages.
		if (event.data) {
			if (event.data.hasOwnProperty('devtoolsEnabled')) {
				return;
			}
			if (event.data.source) {
			    if (event.data.source.includes('vue-devtools')) {
				    return;
                }
			}
		} else {
            return;
        }
		// console.log("event:", event);
        var message = JSON.parse(event.data);
		console.log("paypal message:", message);
		//	iFrame error.
        if (typeof message['cause'] !== 'undefined') { 
            let ppplusError = message['cause'].replace (/['"]+/g,""); //log & attach this error into the order if possible
			console.log(`Receiving ppp approval message: ${ppplusError}`);
			// <<Insert Code Here>>
            switch (ppplusError)
                {
                    case "CHECK_PROVIDED_USER_DATA":
                    case "INVALID_DATA_FIRST_NAME": 
                    case "PPPLUS_NOT_AVAILABLE_FOR_MERCHAN": 
                    case "SET_INSTALLMENTS_FAIL": 
                    case "PAYMENT_ALREADY_DONE": 
						alert ("Ocorreu um erro inesperado, por favor tente novamente. (" + ppplusError + ")"); //pt_BR
						//Generic error, inform the customer to try again; generate a new approval_url and reload the iFrame.
						// <<Insert Code Here>>
						break;
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
		// Set element height, avoiding paypal configuration.
        // if (message['action'] == 'loaded') {
			// let ppplusContainerWidth = document.getElementById('ppplus-container').offsetWidth;
			// let ppplusElemet = document.getElementById('ppplus');
			// if (ppplusContainerWidth >= 700) {
				// ppplusElemet.style.height = '400px';	
			// } else if (ppplusContainerWidth >= 500) {
				// ppplusElemet.style.height = '460px';	
			// } else if (ppplusContainerWidth >= 400) {
				// ppplusElemet.style.height = '490px';	
			// } else {
				// ppplusElemet.style.height = '550px';	
			// }
			// // console.log(`ppplusContainerWidth: ${ppplusContainerWidth}`);
			// // console.log(`ppplusElemet.style.height: ${ppplusElemet.style.height}`);
		// }
		//	PPPlus session approved, do logic here.
        if (message['action'] == 'checkout') {
            // var rememberedCard = null;
            // var payerID = null;

            // rememberedCard = message['result']['rememberedCards']; //save on user BD record
            // payerID = message['result']['payer']['payer_info']['payer_id']; //use it on executePayment API

			// Execute payment.
			app.savePPPApprovalPayment(message);

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
		console.error("Processing message from paypal.", e);
        console.log(`event.data: ${JSON.stringify(event.data, null, 2)}`);
        console.log(`event: ${JSON.stringify(event, null, 2)}`);
    }
}

// Url for paypal approval payment.
let urlAproval;
order.payment.pppCreatePayment.links.forEach(item=>{
	if (item.rel == "approval_url") {
		urlAproval = item.href;
		return;
	}
});
// console.log(`approvalURL: ${urlAproval}`);

// To extract first and last name.
let nameParts  = order.name.split(" ");

let pppConfig = { 
	approvalUrl: urlAproval,
	placeholder: "ppplus",
	mode: env,	// live or sandbox.
	payerFirstName: nameParts[0],
	payerLastName: nameParts[nameParts.length - 1],
	payerEmail: order.email,
	payerPhone: order.mobileNumber,
	payerTaxId: order.cpf,
	payerTaxIdType: "BR_CPF",	// BR_CNPJ
	language: "pt_BR",
	country: "BR",
	enableContinue: "continueButton",
	disableContinue: "continueButton",
	// iframeHeight: "570",
	iframeHeight: "420",
	// rememberedCards: "",
	// merchantInstallmentSelectionOptional: true,	// It is the default alredy.
	// merchantInstallmentSelection: 2,	// Not use if merchantInstallmentSelectionOpional = true.
	// The number of installments is configured into paypal account.
};
console.log(`ppp config: ${JSON.stringify(pppConfig, null, 2)}`);

// Paypal script.
let ppp = PAYPAL.apps.PPP(pppConfig);
