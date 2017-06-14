const express = require('express');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = require('../bin/dbConfig');
const passport = require('passport');
const bcrypt = require('bcrypt');
// Personal modules.
const log = require('../bin/log');

// Signup page.
router.get('/signup', (req, res, next)=>{
  res.render('signUp');
});
// Sign up request.
router.post('/signup', (req, res, next)=>{
  // log.debug(`req.body: ${JSON.stringify(req.body)}`);
  if (req.body.username && req.body.password) {
    // Crypt password.
    bcrypt.hash(req.body.password, 6, (err, hash)=>{
      // Error.
      if (err) {
        log.error(`router.post - bycrpt.hash: ${err}`);
        res.json({ success: false, message: 'Sign up failed' });
        return;
      }
      // Create user.
      const user = {
        username: req.body.username,
        password: hash,
        admin: false,
        status: 'active'
      };
      // Insert user on database.
      mongo.db.collection(dbConfig.collSession).insertOne(user)
      .then(result=>{
        res.json({ success: true, message: 'Sign up successfully accomplished' });
      })
      .catch(err=>{
        res.json({ success: false, message: 'Sign up failed' });
        console.log(`sign-up-error: ${err}`);
      });
    });
  }
});

// Login page.
router.get('/login', (req, res, next)=>{
  // Message from authentication, who set a flash message with erros.
  res.render('login', { message: req.flash('error') });
});
// Login request.
router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: 'login',
    badRequestMessage: 'Falta credenciais.',
    failureFlash: true}));

// logout
router.get('/logout', (req, res, next)=>{
  console.log(`req.user: ${JSON.stringify(req.user)}`);
  if (req.isAuthenticated()) {
    log.verbose(`User ${req.user.username} has Logout.`);
    req.logout();
    res.redirect('/users/login');
  } else {
    log.verbose('No user logged to make logout.');
    res.redirect('/users/login');
  }
});

// router.get('/test', (req, res, next)=>{
//   console.log(`cookies: ${JSON.stringify(req.cookies)}`);
//   console.log(`session: ${JSON.stringify(req.session)}`);
//   console.log(`signed cookies: ${JSON.stringify(req.signedCookies)}`);
//   let user = 'no user';
//   if (req.user) { user = req.user.username; }
//   res.render('test', {user: user});
// });
//
// // user logged
// router.get('/user', (req, res, next)=>{
//   res.render('user');
// });

module.exports = router;
