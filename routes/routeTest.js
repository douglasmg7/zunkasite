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
    emailSender.sendMailToDev("Test", `Teste de envio realizado as ${Date()}.`);
    emailSender.sendMailToAdmin("Test", `Teste de envio realizado as ${Date()}.`);
    res.send('Email enviado.');            
});

module.exports = router;
