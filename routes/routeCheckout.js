'use strict';
const express = require('express');
const router = express.Router();
const dbConfig = require('../config/db');
const passport = require('passport');
const nodemailer = require('nodemailer');
const soap = require('soap');
// const https = require('https');
// const request = require('request');
// var paypal = require('paypal-rest-sdk');

// Personal modules.
const log = require('../config/log');
const User = require('../model/user');
const Address = require('../model/address');
const Order = require('../model/order');
const Product = require('../model/product');

module.exports = router;

// Format number to money format.
function formatMoney(val){
  return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Check permission.
function checkPermission (req, res, next) {
  // Should be admin.
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/users/login');
}

// Check not logged.
function checkNotLogged (req, res, next) {
  // Should be admin.
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Transporter object using the default SMTP transport.
let transporter = nodemailer.createTransport({
    host: 'smtps.dialhost.com.br',
    port: 587,
    // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'dev@zunka.com.br',
        pass: 'SergioMiranda1'
    }
});

// Shipping address page.
router.get('/shipping-address', (req, res, next)=>{
  Address.find({ user_id: req.user._id }, (err, addresss)=>{
    if (err) return next(err);
    let newAddress = new Address();
    res.render('checkout/shippingAddress', {
      nav: {
      },
      addresss,
      newAddress
    });
  });
});

// Ship address selected.
router.post('/shipping-address', (req, res, next)=>{
  // Existing address selected.
  if (req.body.address_id) {
    // Create order.
    createOrder(req.body.address_id); 
  }
  // New address selected.
  else {
    // Validation.
    req.sanitize("newAddress.name").trim();
    req.sanitize("newAddress.cep").trim();
    req.sanitize("newAddress.address").trim();
    req.sanitize("newAddress.addressNumber").trim();
    req.sanitize("newAddress.district").trim();
    req.sanitize("newAddress.city").trim();
    req.sanitize("newAddress.state").trim();
    req.sanitize("newAddress.phone").trim();
    req.checkBody('newAddress.name', 'Campo deve ser preenchido.').notEmpty();
    req.checkBody('newAddress.cep', 'Campo deve ser preenchido.').notEmpty();
    req.checkBody('newAddress.address', 'Campo deve ser preenchido.').notEmpty();
    req.checkBody('newAddress.addressNumber', 'Campo deve ser preenchido.').notEmpty();
    req.checkBody('newAddress.district', 'Campo deve ser preenchido.').notEmpty();
    req.checkBody('newAddress.city', 'Campo deve ser preenchido.').notEmpty();
    req.checkBody('newAddress.state', 'Campo deve ser preenchido.').notEmpty();
    req.checkBody('newAddress.phone', 'Campo deve ser preenchido.').notEmpty();
    req.getValidationResult().then(function(result) {
      // Send validations errors to client.
      if (!result.isEmpty()) {
        res.json({validation: result.array()});
        return;
      } 
      // Save address.
      else {
        let address = new Address(req.body.newAddress);
        address.user_id = req.user._id;
        address.save((err, newAddress) => {
          if (err) {
            res.json({err});
            return next(err); 
          } else {
            log.info(`Address ${newAddress._id} saved.`);
            // Create order.
            createOrder(address._id);
          }
        });
      }    
    });
  }

  // Create order.
  function createOrder(address_id){
    // Find selected address.
    Address.findById(address_id, (err, address)=>{
      if (err) return next(err);
      // Remove order with ship address selected, to start from begin again.
      Order.remove({user_id: req.user._id}, err=>{
        if (err) return next(err);
        // Get products itens.
        let items = []
        for (var i = 0; i < req.cart.products.length; i++) {
          let item = {
            _id: req.cart.products[i]._id,
            name: req.cart.products[i].title,
            quantity: req.cart.products[i].qtd,
            price: req.cart.products[i].price.toFixed(2),
            length: req.cart.products[i].length,
            height: req.cart.products[i].height,
            width: req.cart.products[i].width,
            weight: req.cart.products[i].weight
          }
          items.push(item);
        }
        // console.log(`cart: ${JSON.stringify(req.cart)}`);
        // Create a new order.
        let order = new Order();
        order.items = items;
        order.user_id = req.user._id;
        order.name = req.user.name;
        order.email = req.user.email;
        order.status = 'shipAddressSelected';
        order.shipAddress = {};
        order.shipAddress.name = address.name;
        order.shipAddress.cep = address.cep;
        order.shipAddress.phone = address.phone;
        order.shipAddress.address = address.address;
        order.shipAddress.addressNumber = address.addressNumber;
        order.shipAddress.addressComplement = address.addressComplement;
        order.shipAddress.district = address.district;
        order.shipAddress.city = address.city;
        order.shipAddress.state = address.state;
        order.save(err=>{
          if (err) {
            res.json({ err: err })
          } else {
            res.json({});
          }
        });        
      });
    })
  };

});

// Ship address page old.
router.get('/ship-address', (req, res, next)=>{
  Address.find({ user_id: req.user._id }, (err, addresss)=>{
    if (err) return next(err);
    let data = req.flash();
    data.addresss = addresss;
    res.render('checkout/shipAddress_old', data); 
  })
});

// Ship address selected.
router.get('/ship-address-selected/:address_id', (req, res, next)=>{
  // Find selected address.
  Address.findById(req.params.address_id, (err, address)=>{
    // console.log(`req.user.email: ${req.user.email}`);
    // console.log(`req.user.name: ${req.user.name}`);
    if (err) return next(err);
    // Remove order with ship address selected, to start from begin again.
    Order.remove({user_id: req.user._id}, err=>{
      if (err) return next(err);
      // Create a new order.
      let order = new Order();
      order.user_id = req.user._id;
      order.name = req.user.name;
      order.email = req.user.email;
      order.status = 'shipAddressSelected';
      order.shipAddress = {};
      order.shipAddress.name = address.name;
      order.shipAddress.cep = address.cep;
      order.shipAddress.phone = address.phone;
      order.shipAddress.address = address.address;
      order.shipAddress.addressNumber = address.addressNumber;
      order.shipAddress.addressComplement = address.addressComplement;
      order.shipAddress.district = address.district;
      order.shipAddress.city = address.city;
      order.shipAddress.state = address.state;
      order.save(err=>{
        if (err) return next(err);
        res.redirect('/checkout/shipment'); 
      });        
    });
  })
});

// Add address.
router.post('/ship-address-add', checkPermission, (req, res, next)=>{
  // Validation.
  req.sanitize("name").trim();
  req.sanitize("cep").trim();
  req.sanitize("address").trim();
  req.sanitize("addressNumber").trim();
  req.sanitize("district").trim();
  req.sanitize("city").trim();
  req.sanitize("state").trim();
  req.sanitize("phone").trim();
  req.checkBody('name', 'Campo NOME deve ser preenchido.').notEmpty();
  req.checkBody('cep', 'Campo CEP deve ser preenchido.').notEmpty();
  req.checkBody('address', 'Campo ENDEREÇO deve ser preenchido.').notEmpty();
  req.checkBody('addressNumber', 'Campo NÚMERO deve ser preenchido.').notEmpty();
  req.checkBody('district', 'Campo BAIRRO deve ser preenchido.').notEmpty();
  req.checkBody('city', 'Campo CIDADE deve ser preenchido.').notEmpty();
  req.checkBody('state', 'Campo ESTADO deve ser preenchido.').notEmpty();
  req.checkBody('phone', 'Campo TELEFONE deve ser preenchido.').notEmpty();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    // Save address.
    else {
      let address = new Address();
      address.user_id = req.user._id;
      address.name = req.body.name;
      address.cep = req.body.cep;
      address.phone = req.body.phone;
      address.address = req.body.address;
      address.addressNumber = req.body.addressNumber;
      address.addressComplement = req.body.addressComplement;
      address.district = req.body.district;
      address.city = req.body.city;
      address.state = req.body.state;
      address.save(function(err) {
        if (err) { return next(err); }
        Order.remove({user_id: req.user._id}, err=>{
          if (err) { return next(err); }
          // Create order.
          let order = new Order();
          order.user_id = req.user._id;
          order.status = 'shipAddressSelected';
          order.shipAddress = {};
          order.shipAddress.name = address.name;
          order.shipAddress.cep = address.cep;
          order.shipAddress.phone = address.phone;
          order.shipAddress.address = address.address;
          order.shipAddress.addressNumber = address.addressNumber;
          order.shipAddress.addressComplement = address.addressComplement;
          order.shipAddress.district = address.district;
          order.shipAddress.city = address.city;
          order.shipAddress.state = address.state;
          order.save(err=>{
            if (err) return next(err);
            res.redirect('/checkout/shipment'); 
          });
        });
      });        
    }
  });
});

// Select shipment page.
router.get('/shipment', (req, res, next)=>{
  Order.findOne({user_id: req.user._id}, (err, order)=>{
    if (err) { return next(err); }
    if (!order) {
      return next(new Error('No order to continue checkout.')); }
    else {
      res.render('checkout/shipment', { shipAddress: order.shipAddress, formatMoney: formatMoney }); }
  });
});

// Select shipment.
router.post('/shipment', (req, res, next)=>{
  // Get products itens.
  let items = []
  for (var i = 0; i < req.cart.products.length; i++) {
    let item = {
      _id: req.cart.products[i]._id,
      name: req.cart.products[i].title,
      quantity: req.cart.products[i].qtd,
      price: req.cart.products[i].price.toFixed(2) 
    }
    items.push(item);
  }
  console.log(`cart: ${JSON.stringify(req.cart)}`);
  // Set shipment method to default.
  Order.update(
    { user_id: req.user._id }, 
    { 
      items: items, 
      subtotalPrice: req.cart.totalPrice.toFixed(2),
      shippingPrice: '.33',
      totalPrice: (.33 + req.cart.totalPrice).toFixed(2),
      shipMethod: 'default', 
      status: 'shipMethodSelected'
    }, err=>{ if (err) { return next(err) };
    res.redirect('/checkout/payment');
  });    
});

// Select payment page.
router.get('/payment', (req, res, next)=>{
  Order.findOne({user_id: req.user._id}, (err, order)=>{
    if (err) { return next(err); }
    if (!order) {
      return next(new Error('No order to continue checkout.')); }
    else {
      res.render('checkout/payment', { order: order, formatMoney: formatMoney }); }
  });  
});

// Select payment page.
router.get('/return', (req, res, next)=>{
  console.log('Return called.');
  res.render('/'); 
});

// Select payment page.
router.get('/cancel', (req, res, next)=>{
  console.log('Cancel called.');
  res.render('/'); 
});
// // Select payment.
// router.post('/payment', (req, res, next)=>{
  // // Configuration.
  // paypal.configure({
  //   'mode': 'sandbox', //sandbox or live
  //   'client_id': 'ASpmuFYrAVJcuEiBR5kP8lBdfEJqz4b8hsPQ0fKV7spzkiYFQc2BtA2q7M5vyXTPFuUELBiOpGmfhSZw',
  //   'client_secret': 'EPDRmbUrj1SwC8XsLVV-Tw-9r0jg7GmBr3MFcNOd6xL3S-cXQ7VGbdJPmb4YBI_ZncIyKg82kKeAWJyT'
  // });
  // // Payment.
  // var paymentInfo = {
  //     "intent": "sale",
  //     "payer": {
  //         "payment_method": "paypal"
  //     },
  //     "redirect_urls": {
  //         "return_url": "http://return.url",
  //         "cancel_url": "http://cancel.url"
  //     },
  //     "transactions": [{
  //         "item_list": {
  //             "items": [{
  //                 "name": "item",
  //                 "sku": "item",
  //                 "price": "1.00",
  //                 "currency": "USD",
  //                 "quantity": 1
  //             }]
  //         },
  //         "amount": {
  //             "currency": "USD",
  //             "total": "1.00"
  //         },
  //         "description": "This is the payment description."
  //     }]
  // };
  // // Paypal request.
  // console.log('### paypal to be request ###');
  // paypal.payment.create(paymentInfo, (err, payment)=>{
  //     if (err) return next(err);
  //     console.log("### Payment Response ###");
  //     console.log(JSON.stringify(payment));
  // }); 

  // let nvpData = {
  //   USER: '',
  //   PWD: '',
  //   SIGNATURE: '',
  //   VERSION: '108.0',
  //   METHOD: 'SetExpressCheckout',
  //   PAYMENTREQUEST_0_PAYMENTACTION: 'SALE',
  //   PAYMENTREQUEST_0_AMT: '22.00',
  //   PAYMENTREQUEST_0_CURRENCYCODE: 'BRL',
  //   PAYMENTREQUEST_0_ITEMAMT: '22.00',
  //   PAYMENTREQUEST_0_INVNUM: '1234',
  //   L_PAYMENTREQUEST_0_NAME0: 'Item A',
  //   L_PAYMENTREQUEST_0_DESC0: 'Produto A – 110V',
  //   L_PAYMENTREQUEST_0_AMT0: '11.00',
  //   L_PAYMENTREQUEST_0_QTY0: '1',
  //   L_PAYMENTREQUEST_0_ITEMAMT: '11.00',
  //   L_PAYMENTREQUEST_0_NAME1: 'Item B',
  //   L_PAYMENTREQUEST_0_DESC1: 'Produto B – 220V',
  //   L_PAYMENTREQUEST_0_AMT1: '11.00',
  //   L_PAYMENTREQUEST_0_QTY1: '1',
  //   RETURNURL: 'http://PayPalPartner.com.br/VendeFrete?return=1',
  //   CANCELURL: 'http://PayPalPartner.com.br/CancelaFrete',
  //   BUTTONSOURCE: 'BR_EC_EMPRESA' 
  // }

  // requset.post('https://paypal', (err, res, body)=>{
  //   if(err) return next(err);
  //   console.log('status code: ', res && res.statusCode);
  //   console.log('body: ', body);

  // });

  // // Set options.
  // let options = {
  //   host: '',
  //   path: '',
  //   port: 80,
  //   method: POST 
  // };
  // // Paypal request.
  // https.req(options, res=>{
  //   let data = '';
  //   res.on('data', chunk=>{
  //     data += chunk;
  //   });
  //   res.on('end', ()=>{
  //     console.log(data);
  //   })
  // }).
  // on('error', err=>{
  //   return next(err);
  // }).
  // end();
// });

// Estimate shipment.
router.get('/ship-estimate', (req, res, next)=>{
  console.log('req.query', req.query);
  Product.findById(req.query.productId, (err, product)=>{
    if (err) { return next(err); }
    if (!product) {  return next(new Error('Product not found.')); }
    // Create soap.
    soap.createClient('http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx?wsdl', (err, client)=>{
      if (err) {
        log.error(err, new Error().stack);
        res.json({ success: false });
        return;
      }
      // Argments.
      let args = {
        nCdEmpresa: '',  // Código administrativo junto à ECT (para clientes com contrato) .
        sDsSenha: '',  
        nCdServico: '04510',  // Para clientes sem contrato (04510 - PAC à vista).
        sCepOrigem: '31030160',
        sCepDestino: req.query.cepDestiny.replace('-', ''),
        nVlPeso: (product.storeProductWeight / 1000).toString(),    // Weight in Kg.
        nCdFormato: 1,    // 1 - caixa/pacote, 2 - rolo/prisma, 3 - Envelope.
        nVlComprimento: product.storeProductLength,  // Lenght in cm.
        nVlAltura: product.storeProductHeight,  // Height in cm.
        nVlLargura: product.storeProductWidth,   // Width in cm.
        nVlDiametro: 0,   // Diâmetro em cm.
        sCdMaoPropria      : 'N',   // Se a encomenda será entregue com o serviço adicional mão própria.
        nVlValorDeclarado  : 0,
        sCdAvisoRecebimento: 'N'
      };
      // console.log('args', args);
      // Call webservice.
      client.CalcPrecoPrazo(args, (err, result)=>{
        if (err) {
          log.error(err, new Error().stack);
          res.json({ success: false, errMsg: 'Serviço indisponível' });
          return;
        }
        // Result.
        if (result.CalcPrecoPrazoResult.Servicos.cServico[0].Erro !== '0') {
          log.error('WS Correios erro: ' + result.CalcPrecoPrazoResult.Servicos.cServico[0].MsgErro, new Error().stack);
          res.json({ success: false, errMsg: 'CEP inválido' });
          return;
        }
        res.json({ success: true, correio: result.CalcPrecoPrazoResult.Servicos.cServico[0] });
        // console.log('correios result: ', result.CalcPrecoPrazoResult.Servicos.cServico[0]);
      });
    });
  });
});

