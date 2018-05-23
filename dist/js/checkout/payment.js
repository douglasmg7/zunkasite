// Vue.
var app = new Vue({
  el: '#app',
  data: {
    showErrMsg: false,
    errMsg: '',
    showCanceledMsg: false
  },
});

// Items.
let items = [];
for (var i = 0; i < order.items.length; i++) {
  let item = {
    name: order.items[i].name,
    // item.description: '',
    quantity: order.items[i].quantity,
    price: order.items[i].price,
    //- tax: "0.01",
    sku: order.items[i]._id,
    currency: "BRL"
  };
  items.push(item);
}
// Shipping address.
let shippingAddress = {
  recipient_name: order.shipping.address.name,
  line1: `${order.shipping.address.address}, ${order.shipping.address.addressNumber} - ${order.shipping.address.district}`,
  line2: order.shipping.address.complement,
  city: order.shipping.address.city,
  country_code: 'BR',
  postal_code: order.shipping.address.cep,
  phone: order.shipping.address.phone,
  state: order.shipping.address.state
};
// console.log(`shippingAddress: ${JSON.stringify(shippingAddress)}`);
// Paypal Express Checkout. 
// https://developer.paypal.com/docs/api/payments/
paypal.Button.render({
  env: 'sandbox', // production or sandbox,
  // env: 'production'
  commit: true, // Show a 'Pay Now' button.
  locale: 'pt_BR',
  style: {
    // size: 'small',
    size: 'medium',
    // size: 'large',
    // size: 'responsive',
    // color: 'blue',
    color: 'gold',
    // shape: 'rect',
    shape: 'pill',
    // label: 'checkout'
    // label: 'installment'
    // label: 'paypal'
    label: 'pay'
  },
  client: {
      sandbox:    'ASpmuFYrAVJcuEiBR5kP8lBdfEJqz4b8hsPQ0fKV7spzkiYFQc2BtA2q7M5vyXTPFuUELBiOpGmfhSZw',
      production: 'xxxxxxxxx'
  },
  // Set up the payment.
  payment: function(data, actions) {
    return actions.payment.create({
      payment: {
        intent: 'sale',   // Makes an immediate payment.
        payer: {
          payment_method: 'paypal'
        },
        transactions: [
          {
            // reference_id: 'asdfasdfasdfasdf', // Optional - i will use order _id.
            amount: {
              total: order.totalPrice,
              currency: "BRL",
              details: {
                subtotal: order.subtotalPrice,
                //- tax: "0.01",
                shipping: order.shipping.price,
                //- handling_fee: "0.01",
                //- shipping_discount: "-0.01",
                //- insurance: "0.01"
              }
            },
            description: 'Itens do carrinho.',
            // custom: 'EBAY_EMS_90048630024435',
            // soft_descriptor: 'ECHI5786786',
            // purchase_order: 'asefeaf',
            item_list: {
              items: items,
              shipping_address: shippingAddress
            }
          }
        ],
        // redirect_urls: {
        //   return_url: "https://localhost:3080/checkout/return",
        //   cancel_url: "https://localhost:3080/checkout/cancel"
        // }
      }            
    });
  },
  // Execute the payment.
  onAuthorize: function(data, actions) {
    // Hide end clean messages.
    console.log('onAuthorize');
    this.showCanceledMsg = false;
    this.showErrMsg = false;
    this.errMsg = '';
    // Make a call to the REST api to execute the payment
    return actions.payment.execute()
      .then(function(payment) {
        // The payment is complete!
        // You can now show a confirmation message to the customer.
        console.log('Payment: ', JSON.stringify(payment));
        window.alert('Payment Complete!');
      }).catch(err=>{
        return next(err);
      });
  },
  // Buyer cancelled the payment.
  onCancel: function(data, actions) {
    console.log('Payment canceled.');
    // Show message canceled by user.
    this.showErrMsg = false;
    this.errMsg = '';
    this.showCanceledMsg = true;
    console.log('end onCancel');
    // By default, the buyer is returned to the original page, but you're free to use this function to take them to a different page.
  },
  // An error occurred during the transaction.
  onError: function(err) {
    console.error(`Payment error: ${err}`);
    // Show err message.
    this.showCanceledMsg = false;
    this.errMsg = err;
    this.showErrMsg = true;
  }
}, '#paypal-button');