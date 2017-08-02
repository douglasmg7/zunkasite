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
  res.render('signup', { message: req.flash('error') });
});

// Sign up request.
router.post('/signup', passport.authenticate('local.signup', {
  successRedirect: '/',
  failureRedirect: '/users/signup',
  failureFlash: true
}));

// Login bootstrap page.
router.get('/login', (req, res, next)=>{
  // req.flash - message from authentication, which set a flash message with erros.
  const error = req.flash('error');
  log.debug(`Login flash error: ${error}`);
  // res.render('login', { csrfToken: req.csrfToken(), message: error });
  res.render('login', { message: error });
});

// Login clean page.
router.get('/loginc', (req, res, next)=>{
  // Message from authentication, who set a flash message with erros.
  res.render('loginC', { message: req.flash('error') });
});

// Login request.
router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: 'login',
    badRequestMessage: 'Falta credenciais.',
    failureFlash: true
  })
);

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

module.exports = router;
