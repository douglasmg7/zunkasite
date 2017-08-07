'use strict';
const express = require('express');
const redis = require('../model/redis');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = require('../bin/dbConfig');
const passport = require('passport');
const crypto = require('crypto');
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

// Forgot password page.
router.get('/forgot', (req, res, next)=>{
  res.render('forgot', { messages: req.flash('error') });
});

// Forgot password.
router.post('/forgot', (req, res, next)=>{
  // Create a radom key.
  crypto.randomBytes(20, function(err, buf) {
    if (err) { 
      log.error(err, new Error().stack);
      req.flash('error', 'Serviço indisponível.');
      res.redirect('back');            
      return; 
    }
    var token = buf.toString('hex');
    // Make token disponible for 6 horas (6 x 60 x 60 = 21600).
    redis.setex(`reset:${req.body.email}`, 60, token, err=>{
      if (err) { 
        log.error(err, new Error().stack);
        req.flash('error', 'Serviço indisponível.');
        res.redirect('back');            
        return; 
      }
      let mailOptions = {
          from: 'dev@zunka.com.br',
          to: 'douglasmg7@gmail.com',
          subject: 'Solicitação para Redefinir senha.',
          text: 'Você recebeu este e-mail porquê você (ou alguem) requisitou a criação da senha de sua conta.\n\n' + 
                'Por favor click no link, ou cole no seu navegador de internet para completar o processo.\n\n' + 
                'http://' + req.headers.host + '/reset/' + token + '\n' +
                // 'Esta solicitação de redefinição expira em duas horas.\n' +
                'Se não foi você que requisitou esta redefinição de senha, por favor ignore este e-mail e sua senha permanecerá a mesma.'
      }; 
                //   text: 'Você recebeu este e-mail porquê Você (ou alguem) requisitou a redefinição da senha de sua conta.\n\n' + 
                // 'Por favor click no link, ou cole no seu navegador de internet para completar o processo.\n\n' + 
                // 'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                // 'Se não foi você que requisitou esta redefinição de senha, por favor ignore este e-mail e sua senha permanecerá a mesma.'
      log.info('text', mailOptions.text);
      // transporter.sendMail(mailOptions, function(err, info){
      //   if(err){
      //     // log.error(err, new Error().stack);
      //     log.error(err);
      //   } else {
      //     log.info("mail send successfully");
      //   }
      // });
      let instructionMessage = `Foi enviado um e-mail para ${req.body.email} com instruções para a alteração da senha.`
      res.render('forgot', { messages: req.flash('error'), instructions: [instructionMessage] });
    })
  });
});

// Reset password page.
router.get('/reset/:token', (req, res, next)=>{
  res.render('reset', { messages: req.flash('error') });
});

// Reset password.
router.post('/reset/:token', (req, res, next)=>{
  log.info('params: ', JSON.stringify(req.params));
  log.info('token: ', req.params.token);
  redis.get(`reset:${req.params.token}`, result=>{
    log.info('result: ', result);
    // Not exist token for reset password.
    if (!result) { 
      req.flash('error', 'Chave para alteração da senha expirou.');
      // return res.redirect(`reset/${req.params.token}`);
      return res.redirect('back');
    }
  });
});
// // Login page (no bootstrap).
// router.get('/loginc', (req, res, next)=>{
//   // Message from authentication, who set a flash message with erros.
//   res.render('loginC', { message: req.flash('error') });
// });

module.exports = router;
