const express = require('express');
const redis = require('../model/redis');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = require('../bin/dbConfig');
const passport = require('passport');
const bcrypt = require('bcrypt');
// Personal modules.
const log = require('../bin/log');

// Signup page.
router.get('/signup', (req, res, next)=>{
  res.render('signup', { message: req.flash('error') });
});

// Sign up request.
router.post('/signup', (req, res, next)=>{
  // log.debug(`req.body: ${JSON.stringify(req.body)}`);
  if (req.body.name && req.body.email && req.body.password) {
    // Find user on redis.
    redis.get(`user:${req.body.email}`, (err, result)=>{
      // User alredy exist.
      if (result) {
        log.warn('User alredy exist.');
        res.redirect('/users/signup');
      }
      // Not exit user yet.
      else {
        // Create user.
        const user = {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          group: 'client',
          status: 'active'
        };        
        redis.set(`user:${user.email}`, JSON.stringify(user), (err, result)=>{
          if (err) {
            res.json({ success: false, message: 'Sign up failed' });
            log.error(`sign-up-error: ${err}`);
          }
          else{
            log.info(`Usuario cadastrado com sucesso: ${JSON.stringify(user)}`);
            res.redirect('/users/login');
          }
        });
      }
    });
  };
});

// // Sign up request.
// router.post('/signup', (req, res, next)=>{
//   // log.debug(`req.body: ${JSON.stringify(req.body)}`);
//   if (req.body.username && req.body.password) {
//     // Crypt password.
//     bcrypt.hash(req.body.password, 6, (err, hash)=>{
//       // Error.
//       if (err) {
//         log.error(`router.post - bycrpt.hash: ${err}`);
//         res.json({ success: false, message: 'Sign up failed' });
//         return;
//       }
//       // Create user.
//       const user = {
//         username: req.body.username,
//         password: hash,
//         group: 'client',
//         status: 'active'
//       };
//       // Insert user on database.
//       mongo.db.collection(dbConfig.collSession).insertOne(user)
//       .then(result=>{
//         res.redirect('/users/login');
//         // res.json({ success: true, message: 'Sign up successfully accomplished' });
//       })
//       .catch(err=>{
//         res.json({ success: false, message: 'Sign up failed' });
//         console.log(`sign-up-error: ${err}`);
//       });
//     });
//   }
// });

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
