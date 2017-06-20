'use strict';
const express = require('express');
const router = express.Router();

// Store products.
router.get('/store', (req, res)=>{
  res.render('productsStore');
});

// Manual products.
router.get('/manual', (req, res)=>{
  res.render('productsManual');
});

// All nations products.
router.get('/allnations', (req, res)=>{
  res.render('productsAllNations');
});
module.exports = router;
