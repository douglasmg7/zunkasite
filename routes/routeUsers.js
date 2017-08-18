'use strict';
const express = require('express');
const redis = require('../db/redis');
const router = express.Router();
const mongo = require('../db/mongo');
const dbConfig = require('../config/db');
const passport = require('passport');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// Personal modules.
const log = require('../config/log');
const User = require('../model/user');
const EmailConfirmation = require('../model/emailConfirmation');
const PasswordReset = require('../model/passwordReset');

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

// Signup page.
router.get('/signup', (req, res, next)=>{
  res.render('signup', req.flash());
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
  res.render('login', req.flash());
});

// Confirm signup.
router.get('/login/:token', (req, res, next)=>{
  EmailConfirmation.findOne({ token: req.params.token }, (err, emailConfirmation)=>{
    // Internal error.
    if (err) { 
      log.error(err, Error().stack);
      req.flash('error', 'Serviço indisponível.');
      return res.redirect('/users/login/');
    }  
    // Found Email confirmation.    
    if (emailConfirmation) { 
      // Create the new user.
      let newUser = new User();
      newUser.name = emailConfirmation.name;
      newUser.email = emailConfirmation.email;
      newUser.password = emailConfirmation.password;
      newUser.group = ['admin'];
      newUser.status = 'active';
      // Save.
      newUser.save((err, result)=>{
        if (err) { 
          log.error(err, new Error().stack);
          res.falsh('error', 'Não foi possível confirmar o cadastro.\nFavor entrar em contato com o suporte técnico.');
          res.redirect('/users/login/');
        }
        emailConfirmation.remove(err=>{ if (err) { log.error(err, new Error().stack); } });
        req.flash('success', 'Cadastro finalizado com sucesso.');
        res.redirect('/users/login/');          
      });  
    } 
    // No email confirmation.
    else {
      req.flash('error', 'Solicitação de criação de conta expirou.');
      return res.redirect('/users/login/');    
    }  
  })     
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
  res.render('forgot', req.flash());
});

// Forgot password.
router.post('/forgot', (req, res, next)=>{
  // Validation.
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    else {
      User.findOne({ email: req.body.email }, (err, user)=>{
        // No exist.
        if(!user){
          req.flash('error', `O email ${req.body.email} não está cadastrado no sistema.`);
          res.redirect('back');
          return;
        }        
        // Create token.
        crypto.randomBytes(20, function(err, buf) {
          if (err) { 
            log.error(err, new Error().stack);
            req.flash('error', 'Serviço indisponível.');
            res.redirect('back');            
            return; 
          }
          var token = buf.toString('hex');
          // Include on db.
          new PasswordReset({
            email: user.email,
            token: token
          })
          .save(err=>{
            if (err) { 
              log.error(err, new Error().stack);
              req.flash('error', 'Serviço indisponível.');
              res.redirect('back');            
              return; 
            }
            let mailOptions = {
                from: 'dev@zunka.com.br',
                to: req.body.email,
                subject: 'Solicitação para Redefinir senha.',
                text: 'Você recebeu este e-mail porquê você (ou alguem) requisitou a redefinição da senha de sua conta.\n\n' + 
                      'Por favor click no link, ou cole no seu navegador de internet para completar o processo.\n\n' + 
                      'https://' + req.headers.host + '/users/reset/' + token + '\n\n' +
                      // 'Esta solicitação de redefinição expira em duas horas.\n' +
                      'Se não foi você que requisitou esta redefinição de senha, por favor ignore este e-mail e sua senha permanecerá a mesma.'
            }; 
            log.info('link', 'https://' + req.headers.host + '/users/reset/' + token + '\n\n');
            // // Send email.
            // transporter.sendMail(mailOptions, function(err, info){
            //   if(err){
            //     log.error(err, new Error().stack);
            //   } else {
            //     log.info(`Reset email sent to ${req.body.email}`);
            //   }
            // });
            req.flash('success', `Foi enviado um e-mail para ${req.body.email} com instruções para a alteração da senha.`)
            res.redirect('back');
          });
        });        
      });
    }
  });
});

// Reset password page.
router.get('/reset/:token', (req, res, next)=>{
  PasswordReset.findOne({ token: req.params.token }, (err, passwordReset)=>{
    if (err) { return next(err); }
    // Found.
    if (passwordReset) {
      res.render('reset', req.flash() );
    } 
    // Not found.
    else {
      return res.render('messageLink', { message: 'Chave para alteração de senha expirou.', linkMessage: 'Deseja criar uma nova chave?', linkUrl: '/users/forgot/'});
    }
  });
});

// Reset password.
router.post('/reset/:token', (req, res, next)=>{
  // Validation.
  req.checkBody('password', 'Senha deve conter pelo menos 8 caracteres.').isLength({ min: 8});
  req.checkBody('password', 'Senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.checkBody('password', 'Senha e Confirmação da senha devem ser iguais.').equals(req.body.passwordConfirm);
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    else {
      PasswordReset.findOne({ token: req.params.token }, (err, passwordReset)=>{
        if (err) { return next(err); }     
        // Not exist token to reset password.
        if (!passwordReset) { 
          return res.render('messageLink', { message: 'Chave para alteração de senha expirou.', linkMessage: 'Deseja criar uma nova chave?', linkUrl: '/users/forgot/'});          
        }
        // Token found.
        else {
          User.findOne({ email: passwordReset.email }, (err, user)=>{
            if (err) { return next(err); }  
            // User not found.
            if (!user) {
              return res.render('messageLink', { message: 'Usuário não cadastrado.', linkMessage: 'Deseja criar um cadastro?', linkUrl: '/users/signup/'});          
            }
            // User found.
            else {
              // Update password.      
              user.password = user.encryptPassword(req.body.password);
              user.save(err=>{
                if(err) { return next(err); }
                // Remove password reset.
                passwordReset.remove(err=>{ if(err) { return next(err); } })
                req.flash('success', 'Senha alterada com sucesso.');
                res.redirect('/users/login/');              
              })                 
            }
          })
        }
      })     
    }
  });
});

// Info page.
router.get('/info', (req, res, next)=>{
  res.render('user/info', req.flash());
});

// Access page.
router.get('/access', (req, res, next)=>{
  res.render('user/access', req.flash());
});

// Orders page.
router.get('/orders', (req, res, next)=>{
  res.render('user/orders', req.flash());
});

// Address page.
router.get('/address', (req, res, next)=>{
  res.render('user/address', req.flash());
});

// Delete account page.
router.get('/delete', (req, res, next)=>{
  res.render('user/delete', req.flash());
});

// Delete account.
router.post('/delete', (req, res, next)=>{
  // Delete user.
  redis.del(`user:${req.user.email}`, (err)=>{
    if (err) {
      req.logout();
      log.error(err, new Error().stack);
      req.flash('error', 'Serviço indisponível.');
      res.redirect('/users/login/');
      return;
    }
    req.logout();
    req.flash('success', 'Conta apagada com sucesso.');
    res.redirect('/users/login/');
  });      
});
// // Login page (no bootstrap).
// router.get('/loginc', (req, res, next)=>{
//   // Message from authentication, who set a flash message with erros.
//   res.render('loginC', { message: req.flash('error') });
// });

module.exports = router;
