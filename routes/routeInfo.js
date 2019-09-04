'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');

// About company.
router.get('/about-company', (req, res, next)=>{
  res.render('info/aboutCompany', {
    nav: {},
  });
})

// Contact.
router.get('/contact', (req, res, next)=>{
  res.render('info/contact', {
    nav: {},
  });
})

// Payment.
router.get('/payment', (req, res, next)=>{
  res.render('info/payment', {
    nav: {},
  });
})

// How to buy.
router.get('/how-to-buy', (req, res, next)=>{
  res.render('info/howToBuy', {
    nav: {},
  });
})

// Retrun policy.
router.get('/return', (req, res, next)=>{
  res.render('info/return', {
    nav: {},
  });
})

// Warranty policy.
router.get('/warranty', (req, res, next)=>{
  res.render('info/warranty', {
    nav: {},
  });
})

// About site.
router.get('/about-site', (req, res, next)=>{
  res.render('info/aboutSite', {
    nav: {},
  });
})

module.exports = router;
