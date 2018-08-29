'use strict';
const express = require('express');
const redis = require('../db/redis');
const router = express.Router();
const email = require('../config/email');
const crypto = require('crypto');
// Personal modules.
const log = require('../config/log');

// Test page.
router.get('/', (req, res, next)=>{
  res.render('sendEmail');
});

// Test.
let text = `Teste de envio realizado as ${Date()}.`
router.post('/send-email', (req, res, next)=>{
  let mailOptions = {
      from: email.from,
      to: 'douglasmg7@gmail.com',
      subject: 'Test.',
      text: text
  }; 
  log.info('Requested to send a email test.');
  log.info(`Email test: ${mailOptions.text}`);
  email.transporter.sendMail(mailOptions, function(err, info){
    if(err){
      log.error(err.stack);
    } else {
      log.info("Email test sent successfully.");
    }
  });   
  res.json({ success: true});            
});

module.exports = router;
