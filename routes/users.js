const express = require('express');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = require('../bin/dbConfig');
const passport = require('passport');

// login page
router.get('/login', (req, res, next)=>{
  console.log(`req.isAuthenticated: ${req.isAuthenticated()}`);
  // console.log(`cookies: ${JSON.stringify(req.cookies)}`);
  console.log(`session: ${JSON.stringify(req.session)}`);
  console.log(`signed cookies: ${JSON.stringify(req.signedCookies)}`);
  console.log(`req.user: ${JSON.stringify(req.user)}`);
  res.render('login');
});
// login
router.post('/login', passport.authenticate('local', {successRedirect: '/', failureRedirect: 'login'}));

// signup page
router.get('/signup', (req, res, next)=>{
  console.log(`req.isAuthenticated: ${req.isAuthenticated()}`);
  // console.log(`cookies: ${JSON.stringify(req.cookies)}`);
  console.log(`session: ${JSON.stringify(req.session)}`);
  console.log(`signed cookies: ${JSON.stringify(req.signedCookies)}`);
  console.log(`req.user: ${JSON.stringify(req.user)}`);
  res.render('signUp');
});
// sign up
router.post('/signup', (req, res, next)=>{
  console.log(`req.body: ${JSON.stringify(req.body)}`);
  // if (req.body.username && req.body.password) {
  //   const user = {
  //     username: req.body.username,
  //     password: req.body.password,
  //     admin: false
  //   };
  //   mongo.db.collection(dbConfig.collSession).insertOne(user)
  //   .then(result=>{
  //     res.json({ success: true, message: 'Sign up successfully accomplished' });
  //   })
  //   .catch(err=>{
  //     res.json({ success: false, message: 'Sign up failed' });
  //     console.log(`sign-up-error: ${err}`);
  //   });
  // }
});

// logout
router.post('/logout', (req, res, next)=>{
  console.log(`req.isAuthenticated: ${req.isAuthenticated()}`);
  console.log(`cookies: ${JSON.stringify(req.cookies)}`);
  console.log(`session: ${JSON.stringify(req.session)}`);
  req.logout();
  console.log('logout');
  res.json({ success: true, message: 'Logout.' });
});

router.get('/test', (req, res, next)=>{
  console.log(`cookies: ${JSON.stringify(req.cookies)}`);
  console.log(`session: ${JSON.stringify(req.session)}`);
  console.log(`signed cookies: ${JSON.stringify(req.signedCookies)}`);
  let user = 'no user';
  if (req.user) { user = req.user.username; }
  res.render('test', {user: user});
});

// user logged
router.get('/user', (req, res, next)=>{
  res.render('user');
});

module.exports = router;
