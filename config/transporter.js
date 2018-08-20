'use strict';
const nodemailer = require('nodemailer');

// Transporter object using the default SMTP transport.
const transporter = nodemailer.createTransport({
    host: 'smtps.dialhost.com.br',
    port: 587,
    // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'dev@zunka.com.br',
        pass: 'SergioMiranda1'
    }
});


module.exports = transporter;
