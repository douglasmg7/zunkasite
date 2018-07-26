'use strict';
const app = require ('express')();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const redis = require('../db/redis');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// My moudles.
const log = require('./log');
const Cart = require('../model/cart');
const User = require('../model/user');
const EmailConfirmation = require('../model/emailConfirmation')

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

// How to save user id on the session.
passport.serializeUser(function(user, done) {
  log.info('passport.serialize');
  done(null, user.email);
});

// Use the user id saved in the session to retrive the data.
passport.deserializeUser(function(id, done) {
  log.info('passport.deserialize');
  // log.info('id: ', id);
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
        log.error(err, new Error().stack);
        return done(err, false, { message: 'Serviço indisponível.'});
      }
      let token = rawToken.toString('hex')
      // Verify if alredy exist a email confirmation.
      EmailConfirmation.findOne({email: req.body.email}, (err, emailConfirmation)=>{
        // Error find email confirmation.
        if (err) { 
          log.error(err, new Error().stack);
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
              log.error(err, new Error().stack);
              return done(err, false, { message: 'Serviço indisponível.'});
            }     
            let mailOptions = {
                  from: 'dev@zunka.com.br',
                  to: req.body.email,
                  subject: 'Solicitação de criação de conta no site da Zunka.',
                  text: 'Você recebeu este e-mail porquê você (ou alguem) requisitou a criação de uma conta no site da Zunka usando este e-mail.\n\n' + 
                        'Por favor click no link, ou cole no seu navegador de internet para confirmar a criação da conta.\n\n' + 
                        'https://' + req.headers.host + '/user/signin/' + token + '\n\n' +
                        'Se não foi você que requisitou esta criação de conta, por favor ignore este e-mail e nenhuma conta será criada.'
            };
            // Send e-mail only in production mode.
            if (req.app.get('env') === 'production') {
              // Send e-mail with link to conclude signup.
              transporter.sendMail(mailOptions, function(err, info){
                if(err){
                  log.error(err, new Error().stack);
                } else {
                  log.info("mail send successfully");
                }
              }); 
            }
            // Log token if not in production. 
            else {
              log.info('link to confirm email: http://' + req.headers.host + '/user/signin/' + token + '\n\n');
            }
            done(null, emailConfirmation, { message: `Foi enviado um e-mail para ${req.body.email} com instruções para completar o cadastro.`});               
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
      log.error(`Passport.use - local strategy - Database error: ${err}`); 
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
            cart.mergeCart(JSON.parse(sessCart));
            redis.del(`cart:${req.sessionID}`);
            redis.set(`cart:${user.email}`, JSON.stringify(cart), (err)=>{
              return done(null, user); 
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


// // Signup.
// passport.use('local.signup', new LocalStrategy({
//   usernameField: 'email',
//   passwordField: 'password',
//   passReqToCallback: true
// }, function(req, email, password, done){
//   // Validation.
//   req.checkBody('name', 'Nome deve conter pelo menos 2 caracteres.').isLength({ min: 2});
//   req.checkBody('name', 'Nome deve conter no máximo 40 caracteres.').isLength({ max: 40});
//   req.checkBody('email', 'E-mail inválido.').isEmail();
//   req.checkBody('password', 'Senha deve conter pelo menos 8 caracteres.').isLength({ min: 8});
//   req.checkBody('password', 'Senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
//   req.checkBody('password', 'Senha e confirmação da senha devem ser iguais').equals(req.body.passwordConfirm);
//   req.sanitizeBody("email").normalizeEmail();
//   req.getValidationResult().then(function(result) {
//     if (!result.isEmpty()) {
//       let messages = [];
//       messages.push(result.array()[0].msg);
//       return done(null, false, req.flash('error', messages));
//     }    
//     // Find user.
//     User.findOne({email: email}, (err, user)=>{
//       if (err) { return done(err, { message: 'Internal error.'} ); }
//       if (user) { return done(null, false, { message: 'E-mail já cadastrado.' }); }
//       // Create a radom key.
//       crypto.randomBytes(20, function(err, rawToken) {
//         if (err) { 
//           log.error(err, new Error().stack);
//           return done(err, false, { message: 'Serviço indisponível.'});
//         }
//         let token = rawToken.toString('hex')
//         // Create the new user.
//         let emailConfirmation = new EmailConfirmation();
//         emailConfirmation.name = req.body.name;
//         emailConfirmation.email = req.body.email;
//         emailConfirmation.password = emailConfirmation.encryptPassword(req.body.password);
//         emailConfirmation.token = token;
//         // Save.
//         emailConfirmation.save((err, result)=>{
//           if (err) { 
//             log.error(err, new Error().stack);
//             return done(err, false, { message: 'Serviço indisponível.'});
//           }     
//           let mailOptions = {
//                 from: 'dev@zunka.com.br',
//                 to: req.body.email,
//                 subject: 'Solicitação de criação de conta no site da Zunka.',
//                 text: 'Você recebeu este e-mail porquê você (ou alguem) requisitou a criação de uma conta no site da Zunka usando este e-mail.\n\n' + 
//                       'Por favor click no link, ou cole no seu navegador de internet para confirmar a criação da conta.\n\n' + 
//                       'https://' + req.headers.host + '/users/login/' + token + '\n\n' +
//                       'Se não foi você que requisitou esta criação de conta, por favor ignore este e-mail e nenhuma conta será criada.'
//           }; 
//           log.info('link: ', 'https://' + req.headers.host + '/users/login/' + token + '\n\n');
//           // transporter.sendMail(mailOptions, function(err, info){
//           //   if(err){
//           //     log.error(err, new Error().stack);
//           //   } else {
//           //     log.info("mail send successfully");
//           //   }
//           // }); 
//           req.flash('success', `Foi enviado um e-mail para ${req.body.email} com instruções para completar o cadastro.`);
//           done(null, emailConfirmation);               
//         });
//       });
//     });
//   });
// }));