'use strict';
const express = require('express');
const redis = require('../model/redis');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = require('../bin/dbConfig');
const passport = require('passport');
// Personal modules.
const log = require('../bin/log');

// Signup page.
router.get('/signup', (req, res, next)=>{
  res.render('signup', { messages: req.flash('error') });
});

// Signup request.
router.post('/signup', passport.authenticate('local.signup', {
  successRedirect: '/users/login',
  failureRedirect: '/users/signup',
  badRequestMessage: 'Campo(s) não preenchidos.',
  failureFlash: true
}));

// Login page.
router.get('/login', (req, res, next)=>{
  res.render('login', { messages: req.flash('error') });
});

// Login request.
router.post('/login', passport.authenticate('local.signin', {
  successRedirect: '/',
  failureRedirect: 'login',
  badRequestMessage: 'Falta credenciais.',
  failureFlash: true
}));

// logout.
router.get('/logout', (req, res, next)=>{
  console.log(`req.user: ${JSON.stringify(req.user)}`);
  if (req.isAuthenticated()) {
    req.logout();
    res.redirect('/users/login');
  } else {
    res.redirect('/users/login');
  }
});

// // Login page (no bootstrap).
// router.get('/loginc', (req, res, next)=>{
//   // Message from authentication, who set a flash message with erros.
//   res.render('loginC', { message: req.flash('error') });
// });

module.exports = router;
