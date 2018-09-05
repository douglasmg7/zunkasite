'use strict';
const app = require ('express')();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const redis = require('../db/redis');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const emailSender = require('./email');
// My moudles.
const log = require('./log');
const Cart = require('../model/cart');
const User = require('../model/user');
const EmailConfirmation = require('../model/emailConfirmation')

// How to save user id on the session.
passport.serializeUser(function(user, done) {
  // log.info('passport.serialize');
  done(null, user.email);
});

// Use the user id saved in the session to retrive the data.
passport.deserializeUser(function(id, done) {
  // log.info('passport.deserialize');
  User.findOne({email: id}, (err, user)=>{
    done(null, user)
  });
});

// Signup.
passport.use('local.signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, email, password, done){ 
  // Find user.
  User.findOne({email: email}, (err, user)=>{
    // if (err) { return done(err, { message: 'Internal error.'} ); }
    if (err) { return done(err, false, { message: 'Internal error.'} ); }
    if (user) { return done(null, false, { message: 'E-mail já cadastrado.' }); }
    // Create a radom key.
    crypto.randomBytes(20, function(err, rawToken) {
      if (err) { 
        log.error(err.stack);
        return done(err, false, { message: 'Serviço indisponível.'});
      }
      let token = rawToken.toString('hex')
      // Verify if alredy exist a email confirmation.
      EmailConfirmation.findOne({email: req.body.email}, (err, emailConfirmation)=>{
        // Error find email confirmation.
        if (err) { 
          log.error(err.stack);
          return done(err, false, { message: 'Serviço indisponível.'});
        }
        // Alredy have email confirmation.
        if (emailConfirmation) {
          return done(null, false, { message: 'Email já foi cadastrado anteriormente, falta confirmação do cadastro atravéz do link enviado para o respectivo email.'});
        }
        // Not email confirmation yet.
        if (!emailConfirmation) {
          // Create the new user.
          let emailConfirmation = new EmailConfirmation();
          emailConfirmation.name = req.body.name;
          emailConfirmation.email = req.body.email;
          emailConfirmation.password = emailConfirmation.encryptPassword(req.body.password);
          emailConfirmation.token = token;
          // Save email confirmation..
          emailConfirmation.save((err, result)=>{
            if (err) { 
              log.error(err.stack);
              return done(err, false, { message: 'Serviço indisponível.'});
            }     
            let emailOptions = {
              from: '',
              to: req.body.email,
              subject: 'Solicitação de criação de conta no site da Zunka.',
              text: 'Você recebeu este e-mail porquê você (ou alguem) requisitou a criação de uma conta no site da Zunka (https://www.zunka.com.br) usando este e-mail.\n\n' + 
              'Por favor clique no link, ou cole-o no seu navegador de internet para concluir a criação da conta.\n\n' + 
              'https://' + req.app.get('hostname') + '/user/signin/' + token + '\n\n' +
              'Se não foi você que requisitou esta criação de conta, por favor, ignore este e-mail e nenhuma conta será criada.',
            };
            emailSender.sendMail(emailOptions, err=>{
              if (err) { 
                log.error(err.stack);
                return done(err, false, {message: 'Internal error.'}); 
              }
              else {
                done(null, emailConfirmation, { message: `Foi enviado um e-mail para ${req.body.email} com instruções para completar o cadastro.`});               
              }
            });
          });
        }
      })
    });
  });
}));

// Signin.
passport.use('local.signin', new LocalStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true }, function (req, email, password, done) {
  // Find email.
  User.findOne({ email: email}, (err, user)=>{
    if (err) { 
      log.error(err.stack); 
      return done(err, false, {message: 'Internal error.'}); 
    }
    // User not found.
    if (!user) { 
      log.warn(`email ${email} not found on database.`); 
      return done(null, false, { message: 'Usuário não cadastrado.'} ); 
    }
    // Password match.
    if (user.validPassword(password)) {
     // Merge cart from session.
      redis.get(`cart:${req.sessionID}`, (err, sessCart)=>{
        if (sessCart) {
          // Get authenticated user cart.
          redis.get(`cart:${user.email}`, (err, userCart)=>{
            let cart = userCart ? new Cart(JSON.parse(userCart)) : new Cart();
            // Merge anonymous cart to authenticated user cart.
            cart.mergeCart(JSON.parse(sessCart), ()=>{
              redis.del(`cart:${req.sessionID}`);
              redis.set(`cart:${user.email}`, JSON.stringify(cart), (err)=>{
                return done(null, user); 
              });   
            });
          }); 
        }
        // No cart session to merge.
        else {
          return done(null, user); 
        }        
      });
    }
    // Wrong password.
    else {
      return done(null, false, { message: 'Senha incorreta.'} ); 
    }
  });
}));