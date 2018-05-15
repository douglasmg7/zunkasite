paypal.Button.render({
  env: 'sandbox', // production or sandbox,
  client: {
      sandbox:    'ASpmuFYrAVJcuEiBR5kP8lBdfEJqz4b8hsPQ0fKV7spzkiYFQc2BtA2q7M5vyXTPFuUELBiOpGmfhSZw',
      production: 'xxxxxxxxx'
  },
  commit: true, // Show a 'Pay Now' button
  payment: function(data, actions) {
    return actions.payment.create({
      payment: {
        intent: "sale",
        payer: {
          payment_method: "paypal"
        },
        transactions: [
          {
            reference_id: 'asdfasdfasdfasdf', // Optional - i will use order _id.
            amount: {
              total: "0.04",
              currency: "BRL",
              details: {
                subtotal: "0.03",
                //- tax: "0.01",
                shipping: "0.01",
                //- handling_fee: "0.01",
                //- shipping_discount: "-0.01",
                //- insurance: "0.01"
              }
            },
            description: "The payment transaction description.",  // The description of what is being paid for.
            custom: "EBAY_EMS_90048630024435",  //  A free-form field for clients' use.
            invoice_number: "48787589673",  // The invoice number to track this payment.
            payment_options: {
              allowed_payment_method: "INSTANT_FUNDING_SOURCE"
            },
            soft_descriptor: "ECHI5786786",
            purchase_order: 'asdfasdfasdf',  // The purchase order number or ID.
            // item_list: {
            //   items: [
            //     {
            //       name: "hat",
            //       description: "Brown hat.",
            //       quantity: "1",
            //       price: "0.01",
            //       //- tax: "0.01",
            //       sku: "1",
            //       currency: "BRL"
            //     },
            //     {
            //       name: "handbag",
            //       description: "Black handbag.",
            //       quantity: "1",
            //       price: "0.02",
            //       //- tax: "0.02",
            //       sku: "product34",
            //       currency: "BRL"
            //     }
            //   ],
            //   shipping_address: {
            //     recipient_name: "Brian Robinson",
            //     line1: "4th Floor",
            //     line2: "Unit #34",
            //     city: "San Jose",
            //     country_code: "BR",
            //     postal_code: "3546000",
            //     phone: "011862212345678",
            //     state: "CA"
            //   }
            // }
          }
        ],
        note_to_payer: "Contact us for any questions on your order.",
        redirect_urls: {
          return_url: "https://localhost:3080/checkout/return",
          cancel_url: "https://localhost:3080/checkout/cancel"
        }
      }            
    });
  },
  // Is called when the buyer approves the payment.
  onAuthorize: function(data, actions) {
    // Make a call to the REST api to execute the payment
    return actions.payment.execute()
      .then(function(payment) {
        console.log('Payment: ', JSON.stringify(payment));
        window.alert('Payment Complete!');
      }).catch(err=>{
        return next(err);
      });
  }
}, '#paypal-button');