'use strict';
const express = require('express');
const redis = require('../db/redis');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
// Personal modules.
const log = require('../config/log');

// Transporter object using the default SMTP transport.
let transporter = nodemailer.createTransport({
    host: 'smtps.dialhost.com.br',
    port: 587,
    // secure:true for port 465, secure:false for port 587
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
  // Create a radom key.
  crypto.randomBytes(20, function(err, buf) {
    if (err) { log.error(err.stack); return; }
    var token = buf.toString('hex');
    // Make token disponible for 6 horas (6 x 60 x 60 = 21600).
    redis.setex(`reset:${token}`, 60, req.user.email, err=>{
      if (err) { log.error(err.stack); return; }
      let mailOptions = {
          from: 'dev@zunka.com.br',
          to: 'douglasmg7@gmail.com',
          subject: 'Zunka - Redefinir senha.',
          text: 'Você recebeu este e-mail porquê você (ou alguem) requisitou a criação da senha de sua conta.\n\n' + 
                'Por favor click no link, ou cole no seu navegador de internet para completar o processo.\n\n' + 
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'Se não foi você que requisitou esta redefinição de senha, por favor ignore este e-mail e sua senha permanecerá a mesma.'
      }; 
                //   text: 'Você recebeu este e-mail porquê Você (ou alguem) requisitou a redefinição da senha de sua conta.\n\n' + 
                // 'Por favor click no link, ou cole no seu navegador de internet para completar o processo.\n\n' + 
                // 'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                // 'Se não foi você que requisitou esta redefinição de senha, por favor ignore este e-mail e sua senha permanecerá a mesma.'
      log.info('send email request.');
      log.info('text', mailOptions.text);
      // transporter.sendMail(mailOptions, function(err, info){
      //   if(err){
      //     log.error(err.stack);
      //   } else {
      //     log.info("mail send successfully");
      //   }
      // });   
      res.json({ success: true});            
    })
  });
});

module.exports = router;
