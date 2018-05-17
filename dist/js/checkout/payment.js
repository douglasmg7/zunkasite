console.log(order);
let items = [];
let subtotal = 0;
let shippingPrice = 100;
// Get each product.
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
  subtotal += order.items[i].price;
  items.push(item);
}
console.log(`itens: ${JSON.stringify(items)}`);
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
              total: subtotal + shippingPrice,
              currency: "BRL",
              details: {
                subtotal: subtotal,
                //- tax: "0.01",
                shipping: shippingPrice,
                //- handling_fee: "0.01",
                //- shipping_discount: "-0.01",
                //- insurance: "0.01"
              }
            },
            description: 'Itens do carrinho.',
            custom: 'EBAY_EMS_90048630024435',
            soft_descriptor: 'ECHI5786786',
            purchase_order: 'asefeaf',
            item_list: {
              items: [
                {
                  name: "hat",
                  description: "Brown hat.",
                  quantity: "1",
                  price: "0.01",
                  //- tax: "0.01",
                  sku: "1",
                  currency: "BRL"
                },
                {
                  name: "handbag",
                  description: "Black handbag.",
                  quantity: "1",
                  price: "0.02",
                  //- tax: "0.02",
                  sku: "product34",
                  currency: "BRL"
                }
              ],
              shipping_address: {
                recipient_name: 'Brian Robinson',
                line1: '4th Floor',
                line2: 'Unit #34',
                city: 'San Jose',
                country_code: 'US',
                postal_code: '95131',
                phone: '011862212345678',
                state: 'CA'
              }
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
    console.log('Payment cancelled.');
    // By default, the buyer is returned to the original page, but you're free to use this function to take them to a different page.
  },
  // An error occurred during the transaction.
  onError: function(err) {
    console.error(`Payment error: ${err}`);
  }
}, '#paypal-button');

// // Set up the payment.
// payment: function(data, actions) {
//   return actions.payment.create({
//     payment: {
//       intent: "sale",
//       payer: {
//         payment_method: "paypal"
//       },
//       transactions: [
//         {
//           // reference_id: 'asdfasdfasdfasdf', // Optional - i will use order _id.
//           amount: {
//             total: "0.04",
//             currency: "BRL",
//             details: {
//               subtotal: "0.03",
//               //- tax: "0.01",
//               shipping: "0.01",
//               //- handling_fee: "0.01",
//               //- shipping_discount: "-0.01",
//               //- insurance: "0.01"
//             }
//           },
//           description: "The payment transaction description.",  // The description of what is being paid for.
//           custom: "EBAY_EMS_90048630024435",  //  A free-form field for clients' use.
//           invoice_number: "48787589673",  // The invoice number to track this payment.
//           payment_options: {
//             allowed_payment_method: "INSTANT_FUNDING_SOURCE"
//           },
//           soft_descriptor: "ECHI5786786",
//           purchase_order: 'asdfasdfasdf',  // The purchase order number or ID.
//           // item_list: {
//           //   items: [
//           //     {
//           //       name: "hat",
//           //       description: "Brown hat.",
//           //       quantity: "1",
//           //       price: "0.01",
//           //       //- tax: "0.01",
//           //       sku: "1",
//           //       currency: "BRL"
//           //     },
//           //     {
//           //       name: "handbag",
//           //       description: "Black handbag.",
//           //       quantity: "1",
//           //       price: "0.02",
//           //       //- tax: "0.02",
//           //       sku: "product34",
//           //       currency: "BRL"
//           //     }
//           //   ],
//           //   shipping_address: {
//           //     recipient_name: "Brian Robinson",
//           //     line1: "4th Floor",
//           //     line2: "Unit #34",
//           //     city: "San Jose",
//           //     country_code: "BR",
//           //     postal_code: "3546000",
//           //     phone: "011862212345678",
//           //     state: "CA"
//           //   }
//           // }
//         }
//       ],
//       note_to_payer: "Contact us for any questions on your order.",
//       // redirect_urls: {
//       //   return_url: "https://localhost:3080/checkout/return",
//       //   cancel_url: "https://localhost:3080/checkout/cancel"
//       // }
//     }            
//   });
// },
