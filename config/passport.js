'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const redis = require('../model/redis');
const bcrypt = require('bcrypt-nodejs');
const nodemailer = require('nodemailer');
// My moudles.
const log = require('../bin/log');

// Transporter object using the default SMTP transport.
let transporter = nodemailer.createTransport({
    host: 'zunka.com.br',
    port: 25,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'zunka',
        pass: 'SergioMiranda1'
    }
});

// How to save user on the session.
passport.serializeUser(function(user, done) {
  log.info('passport.serialize');
  done(null, user.email);
});

// Use the user saved in the session to retrive the data.
passport.deserializeUser(function(id, done) {
  log.info('passport.deserialize');
  // log.info('id: ', id);
  redis.get(`user:${id}`, (err, value)=>{
    // log.info('user: ', value);
    done(null, JSON.parse(value));
  });
});

// Signup.
passport.use('local.signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, email, password, done){
  // Validation.
  req.checkBody('name', 'Nome inválido.').isLength({min: 1, max: 40});
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.checkBody('password', 'Senha deve conter pelo menos 8 caracteres.').isLength({ min: 8});
  req.checkBody('password', 'Senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.sanitizeBody('name').escape().trim();
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return done(null, false, req.flash('error', messages));
    }    
    // Verify if user exist.
    redis.get(`user:${req.body.email}`, (err, redisUser)=>{
      if (err) { return done(err, { message: 'Internal error.'} ); }
      if (redisUser) { return done(null, false, { message: 'E-mail já cadastrado.' }); }
      // Create user.
      const cryptPassword = bcrypt.hashSync(req.body.password.trim(), bcrypt.genSaltSync(5), null);
      const newUser = {
        name: req.body.name.trim(),
        email: req.body.email.trim(),
        password: cryptPassword,
        group: 'client',
        status: 'active'
      };        
      redis.set(`user:${newUser.email}`, JSON.stringify(newUser), (err, result)=>{
        if (err) {
          return done(err);
        }
        else{
          let mailOptions = {
              from: 'Zunka site',
              to: 'douglasmg7@gmail.com',
              subject: 'Zunka test.',
              text: 'Nada por enquanto.'
          }; 
          transporter.sendMail(mailOptions, function(err, info){
              if(err){
                log.error(err, new Error().stack);
              } else {
                log.info("mail send successfully");
              }
          }); 
          done(null, newUser);
        }
      });
    });
  });
}));

// Signin.
passport.use('local.signin', new LocalStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true }, function (req, email, password, done) {
  // Validation.
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.checkBody('password', 'Senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return done(null, false, req.flash('error', messages));
    }    
    redis.get(`user:${req.body.email}`, (err, strUser)=>{
      if (err) { 
        log.error(`Passport.use - local strategy - Database error: ${err}`); 
        return done(err, false, {message: 'Internal error.'}); 
      }
      // User not found.
      if (!strUser) { 
        log.warn(`email ${email} not found on database.`); 
        return done(null, false, { message: 'Usuário não cadastrado.'} ); 
      }
      let user = JSON.parse(strUser);
      // Password match.
      if (bcrypt.compareSync(req.body.password, user.password)) {
        // Merge cart from session.
        redis.get(`cart:${req.sessionID}`, (err, sessCart)=>{
          if (sessCart) {
            // Get authenticated user cart.
            redis.get(`cart:${user.email}`, (err, userCart)=>{
              let cart;
              if (userCart) {
                cart = new Cart(JSON.parse(userCart));
              } else {
                cart = new Cart();
              }
              // Merge anonymous cart to authenticated user cart.
              cart.mergeCart(JSON.parse(sessCart));
              redis.del(`cart:${req.sessionID}`);
              redis.set(`cart:${user.email}`, JSON.stringify(cart), (err)=>{
                // log.warn('merged cart: ', JSON.stringify(cart));
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
        log.warn(`Incorrect password for user ${email}`);
        return done(null, false, { message: 'Senha incorreta.'} ); 
      }
    });
  });
}));