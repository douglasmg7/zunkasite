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
  redis.get(`user:${email}`, (err, strUser)=>{
    if (err) { return done(err); }
    if (strUser) { return done(null, false, { message: 'E-mail já está sendo usado.' }); }
    // Create user.
    const signupUser = JSON.stringify(strUser);
    const cryptPassword = bcrypt.hashSync(signupUser.password, bcrypt.genSaltSync(5), null);
    // const getPassword = bcrypt.compareSync(db.password, receivePassword);
    const newUser = {
      name: req.body.name,
      email: email,
      password: cryptPassword,
      group: 'client',
      status: 'active'
    };        
    log.info('newUser: ', newUser);
    redis.set(`user:${newUser.email}`, JSON.stringify(newUser), (err, result)=>{
      if (err) {
        return done(err);
      }
      else{
        done(null, newUser);
      }
    });
  });
}));

// Signin.
passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true }, function (req, email, password, done) {
  // log.warn('LocalStrategy - Redis.');
  // log.warn('req.sessionId: ', req.sessionID);
  redis.get(`user:${email}`, (err, strUser)=>{
    // log.info('strUser: ', strUser);
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
    // if (password === user.password){
    if (bcrypt.compareSync(user.password, password)) {
      // log.warn('new authentication');
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
}));