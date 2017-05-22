'use strict';
const express = require('express');
const router = express.Router();
// store products
router.get('/store', (req, res)=>{
  res.render('productsStore', { title: 'Hey', message: 'Hello there!'});
});
// all nations products
router.get('/allnations', (req, res)=>{
  res.render('productsAllNations');
});
module.exports = router;
