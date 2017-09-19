'use strict';
const express = require('express');
const router = express.Router();
const dbConfig = require('../config/db');
const passport = require('passport');
const nodemailer = require('nodemailer');
// Personal modules.
const log = require('../config/log');
const User = require('../model/user');
const Address = require('../model/address');
const Order = require('../model/order');

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

// Ship address page.
router.get('/ship-address', (req, res, next)=>{
  Address.find({ user_id: req.user._id }, (err, addresss)=>{
    if (err) return next(err);
    let data = req.flash();
    data.addresss = addresss;
    res.render('checkout/shipAddress', data); 
  })
});

// Ship address selected.
router.get('/ship-address-selected/:address_id', (req, res, next)=>{
  // Find selected address.
  Address.findById(req.params.address_id, (err, address)=>{
    if (err) return next(err);
    // Find order with shipAddressSelected status.
    Order.remove({user_id: req.user._id, status: 'shipAddressSelected'}, err=>{
      if (err) return next(err);
      // Not found order.
      let order = new Order();
      order.user_id = req.user._id;
      order.status = 'shipAddressSelected';
      order.shipAddress = {};
      order.shipAddress.name = address.name;
      order.shipAddress.phone = address.phone;
      order.shipAddress.cep = address.cep;
      order.shipAddress.address = address.address;
      order.shipAddress.addressNumber = address.addressNumber;
      order.shipAddress.addressComplement = address.addressComplement;
      order.shipAddress.district = address.district;
      order.shipAddress.city = address.city;
      order.shipAddress.state = address.state;
      order.save(err=>{
        if (err) return next(err);
        res.redirect('/checkout/paymant'); 
      });        
    });
  })
});

// Add address.
router.post('/ship-address-add', checkPermission, (req, res, next)=>{
  // Validation.
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
      address.address = req.body.address;
      address.addressNumber = req.body.addressNumber;
      address.addressComplement = req.body.addressComplement;
      address.district = req.body.district;
      address.city = req.body.city;
      address.state = req.body.state;
      address.phone = req.body.phone;
      address.save(function(err) {
        if (err) { return next(err); }
        Order.remove({user_id: req.user._id, status: 'shipAddressSelected'}, err=>{
          if (err) { return next(err); }
          // Create order.
          let order = new Order();
          order.user_id = req.user._id;
          order.status = 'shipAddressSelected';
          order.shipAddress = {};
          order.shipAddress.name = address.name;
          order.shipAddress.phone = address.phone;
          order.shipAddress.cep = address.cep;
          order.shipAddress.address = address.address;
          order.shipAddress.addressNumber = address.addressNumber;
          order.shipAddress.addressComplement = address.addressComplement;
          order.shipAddress.district = address.district;
          order.shipAddress.city = address.city;
          order.shipAddress.state = address.state;
          order.save(err=>{
            if (err) return next(err);
            res.redirect('/checkout/paymant'); 
          });
        });
      });        
    }
  });
});

// Select paymant page.
router.get('/paymant', (req, res, next)=>{
  res.render('checkout/paymant'); 
});

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

module.exports = router;
