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

// CEP origin, Rua Bicas - 31030160.
const CEP_ORIGIN = '31030160';
const STANDARD_DELIVERY_DEADLINE = 10;
const STANDARD_DELIVERY_PRICE = '30,00';

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
      // Remove order not closed yet, to start from begin again.
      Order.remove({user_id: req.user._id, isClosed: {$exists: false}}, err=>{
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
        order.subtotalPrice = req.cart.totalPrice.toFixed(2);
        order.user_id = req.user._id;
        order.name = req.user.name;
        order.email = req.user.email;
        order.isShippingAddressSelected = Date.now();
        order.shipping = { address: {} };
        order.shipping.address.name = address.name;
        order.shipping.address.cep = address.cep;
        order.shipping.address.phone = address.phone;
        order.shipping.address.address = address.address;
        order.shipping.address.addressNumber = address.addressNumber;
        order.shipping.address.addressComplement = address.addressComplement;
        order.shipping.address.district = address.district;
        order.shipping.address.city = address.city;
        order.shipping.address.state = address.state;
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

// Select shipment - page.
router.get('/shipment', (req, res, next)=>{
  // Find order not closed yet.
  Order.findOne({user_id: req.user._id, isClosed: {$exists: false}}, (err, order)=>{
    if (err) { return next(err); }
    if (!order) {
      return next(new Error('No order to continue checkout.')); }
    else {
      // Calculate box size shipment approximately.
      let shippingBox = { cepOrigin: CEP_ORIGIN, cepDestiny: order.shipping.address.cep, length: 0, height: 0, width: 0, weight: 0 };
      // For each item.
      for (let i = 0; i < order.items.length; i++) {
        // Get dimensions.
        let dimemsions = [order.items[i].length, order.items[i].height, order.items[i].width];
        // Sort dimensions.
        dimemsions = dimemsions.sort(function (a,b){
            if (a < b) { return -1 }
            if (a > b) { return 1 }
            return 0;
          });
        // Get the big dimension for the box.
        if (dimemsions[2] > shippingBox.length) { shippingBox.length = dimemsions[2]; }
        if (dimemsions[1] > shippingBox.height) { shippingBox.height = dimemsions[1]; }
        shippingBox.width += dimemsions[0];
        shippingBox.weight += order.items[i].weight;
        // Box shipping dimensions.
        order.shipping.box = shippingBox;
      }
      estimateShipping(shippingBox, (err, result)=>{
        // No Correio info.
        if (err) {
          order.shipping.correioResult = {};
          order.shipping.price = STANDARD_DELIVERY_PRICE;
          order.shipping.deadline = STANDARD_DELIVERY_DEADLINE;
        }
        // Got correio info. 
        else {
          order.shipping.correioResult = result;
          // Shipping price.
          if (order.shipping.correioResult.Valor) {
            order.shipping.price = order.shipping.correioResult.Valor;
          } else {
            order.shipping.price = STANDARD_DELIVERY_PRICE;
          }
          // Shipping deadline.
          if (order.shipping.correioResult.PrazoEntrega) {
            order.shipping.deadline = parseInt(order.shipping.correioResult.PrazoEntrega);
          } else {
            order.shipping.deadline = STANDARD_DELIVERY_DEADLINE;
          }
        }
        // Save correio result.
        order.save((err, newAddress) => {
          if (err) {
            res.json({err});
            return next(err); 
          } else {
            res.render('checkout/shipment', { 
              nav: {
              },
              order
            });  
          }
        });
      })
    }
  });
});

// Select shipment.
router.post('/shipment', (req, res, next)=>{
  // Set shipment method to default.
  Order.findOne({ user_id: req.user._id, isClosed: {$exists: false} }, (err, order)=>{
    // Only one option yet. Alredy set on get shippment.
    // shipping.price: 
    // shipping.daedline: 
    order.shipping.method = 'standard',
    order.shipping.carrier = 'correios'
    order.totalPrice = (parseInt(order.subtotalPrice) + parseInt(order.shipping.price)).toFixed(2);
    isShippingMethodSelected = Date.now();
    order.save(err=>{
      if (err) { return next(err) };
      res.redirect('/checkout/payment');
    });
  });
  // Order.update(
  //   { user_id: req.user._id, isClosed: {$exists: false} }, 
  //   { 
  //     // Only one option yet. Alredy set on get shippment.
  //     // shipping.price: 
  //     // shipping.daedline: 
  //     shipping.method: 'standard',
  //     shipping.carrier: 'correios'
  //     totalPrice: parseInt(subtotalPrice) + parseInt(shipping.price);
  //     isShippingMethodSelected: Date.now();
  //   }, 
  //   err=>{ 
  //     if (err) { return next(err) };
  //     res.redirect('/checkout/payment');
  //   }
  // );    
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

// Estimate shipment.
router.get('/ship-estimate', (req, res, next)=>{
  // console.log('req.query', req.query);
  Product.findById(req.query.productId, (err, product)=>{
    if (err) { return next(err); }
    if (!product) {  return next(new Error('Product not found.')); }
    let box = { 
      cepOrigin: CEP_ORIGIN, 
      cepDestiny: req.query.cepDestiny.replace(/\D/g, ''),
      length: product.storeProductLength,
      height: product.storeProductHeight,
      width: product.storeProductWidth,
      weight: product.storeProductWeight 
    }
    console.log(`box: ${JSON.stringify(box)}`);
    estimateShipping(box, (err, result)=>{
      if (err) {
        res.json({ err: err });
        return;
      }
      res.json({correio: result});
    });
  });
});

// Estimate shipment.
// box = {lenght, height, wdith, weight}
// length, height, width in cm.
// weight in grams.
function estimateShipping(box, cb) {
  // Length can not be less than 16cm (correio error);
  if (box.length < 16) { box.length = 16 };
  // Height can not be less than 2cm (correio error);
  if (box.height < 2) { box.height = 2 };
  // Width can not be less than 2cm (correio error);
  if (box.width < 11) { box.width = 11 };
  // Create soap.
  soap.createClient('http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx?wsdl', (err, client)=>{
    if (err) {
      log.error(err, new Error().stack);
      return cb(err);
    }
    // Argments.
    let args = {
      nCdEmpresa: '',  // Código administrativo junto à ECT (para clientes com contrato) .
      sDsSenha: '',  
      nCdServico: '04510',  // Para clientes sem contrato (04510 - PAC à vista).
      sCepOrigem: box.cepOrigin.replace(/\D/g, ''),   
      sCepDestino: box.cepDestiny.replace(/\D/g, ''),
      nVlPeso: (box.weight / 1000).toString(),    // Weight in Kg.
      nCdFormato: 1,    // 1 - caixa/pacote, 2 - rolo/prisma, 3 - Envelope.
      nVlComprimento: box.length,  // Lenght in cm.
      nVlAltura: box.height,  // Height in cm.
      nVlLargura: box.width,   // Width in cm.
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
        return cb('Serviço indisponível');
      }
      // Result.
      if (result.CalcPrecoPrazoResult.Servicos.cServico[0].Erro !== '0') {
        log.error('WS Correios: ' + result.CalcPrecoPrazoResult.Servicos.cServico[0].MsgErro, new Error().stack);
        return cb(result.CalcPrecoPrazoResult.Servicos.cServico[0].MsgErro);
      }
      return cb(null, result.CalcPrecoPrazoResult.Servicos.cServico[0]);
    });
  });
};

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