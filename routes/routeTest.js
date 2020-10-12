'use strict';
const express = require('express');
const redis = require('../db/redis');
const router = express.Router();
const emailSender = require('../config/email');
const crypto = require('crypto');
// Personal modules.
const log = require('../config/log');

// Test page.
router.get('/', (req, res, next)=>{
    res.render('test/sendEmail');
});

// Test.
router.post('/send-email', (req, res, next)=>{
    emailSender.sendMailToDevV2("Test", `Teste de envio realizado as ${Date()}.`);

    // let mailOptions = {
        // from: '',
        // to: 'douglasmg7@gmail.com',
        // subject: 'Test',
        // text: `Teste de envio realizado as ${Date()}.`
    // }
    // emailSender.sendMail(mailOptions, err=>{
        // if (err) { 
            // log.error(err.stack);
            // // res.json({ success: false});            
            // res.send('Erro ao enviar email.');            
        // }
        // else {
            // // res.json({ success: true}); 
            // res.send('Email enviado.');            
        // }
    // });          
});

module.exports = router;
