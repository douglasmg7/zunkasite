'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const redis = require('../model/redis');
const bcrypt = require('bcrypt-nodejs');
// My moudles.
const log = require('../bin/log');

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
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return done(null, false, req.flash('error', messages));
    }    
    // Verify if user exist.
    redis.get(`user:${email}`, (err, redisUser)=>{
      if (err) { return done(err, { message: 'Internal error.'} ); }
      if (redisUser) { return done(null, false, { message: 'E-mail já cadastrado.' }); }
      // Create user.
      const cryptPassword = bcrypt.hashSync(password.trim(), bcrypt.genSaltSync(5), null);
      const newUser = {
        name: req.body.name.trim(),
        email: email.trim(),
        password: cryptPassword,
        group: 'client',
        status: 'active'
      };        
      redis.set(`user:${newUser.email}`, JSON.stringify(newUser), (err, result)=>{
        if (err) {
          return done(err);
        }
        else{
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
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return done(null, false, req.flash('error', messages));
    }    
    redis.get(`user:${email}`, (err, strUser)=>{
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
      if (bcrypt.compareSync(password, user.password)) {
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