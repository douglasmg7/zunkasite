'use strict';
const express = require('express');
const redis = require('../model/redis');
const router = express.Router();
const mongo = require('../model/db');
const dbConfig = require('../bin/dbConfig');
const nodemailer = require('nodemailer');
// Personal modules.
const log = require('../bin/log');

// // Transporter object using the default SMTP transport.
// let transporter = nodemailer.createTransport({
//     host: 'zunka.com.br',
//     port: 25,
//     secure: true, // secure:true for port 465, secure:false for port 587
//     auth: {
//         user: 'zunka',
//         pass: 'SergioMiranda1'
//     }
// });

// Transporter object using the default SMTP transport.
let transporter = nodemailer.createTransport({
    host: 'smtps.dialhost.com.br',
    port: 587,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'dev@zunka.com.br',
        pass: 'SergioMiranda1'
    }
});

// Test page.
router.get('/', (req, res, next)=>{
  res.render('sendEmail', { messages: req.flash('error') });
});

// Test.
router.post('/send-email', (req, res, next)=>{
  let mailOptions = {
      from: 'Zunka site',
      to: 'douglasmg7@gmail.com',
      subject: 'Zunka test.',
      text: 'Nada por enquanto.'
  }; 
  log.info('send email request.');
  transporter.sendMail(mailOptions, function(err, info){
    if(err){
      // log.error(err, new Error().stack);
      log.error(err);
    } else {
      log.info("mail send successfully");
    }
  });   
  res.json({ success: true});
});

module.exports = router;
