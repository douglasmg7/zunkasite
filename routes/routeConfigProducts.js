'use strict';
const express = require('express');
const router = express.Router();

// Store products.
router.get('/store', (req, res)=>{
  res.render('productsStore', { user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined }, csrfToken: req.csrfToken() });
  console.warn('csrfToken', req.csrfToken());
  console.warn('req.session: ', req.session);
});

// // Manual products.
// router.get('/manual', (req, res)=>{
//   res.render('productsManual', { user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined } });
// });

// All nations products.
router.get('/allnations', (req, res)=>{
  res.render('productsAllNations', { user: req.isAuthenticated() ? req.user : { username: undefined, group: undefined } });
});
module.exports = router;
