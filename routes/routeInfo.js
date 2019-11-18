'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const marked = require('marked');
const markdownCache = require('../model/markdownCache');

// About company.
router.get('/about-company', (req, res, next)=>{
    // Warranty text.
    let text = '';
    let markdownText = markdownCache.getCache().get('info-sobre-a-empresa');
    if (markdownText) {
        text = marked(markdownText);
    }
    res.render('info/aboutCompany', {
        nav: {},
        text
    });
})

// Contact.
router.get('/contact', (req, res, next)=>{
    // Warranty text.
    let text = '';
    let markdownText = markdownCache.getCache().get('info-contato');
    if (markdownText) {
        text = marked(markdownText);
    }
    res.render('info/contact', {
        nav: {},
        text
    });
})

// Payment.
router.get('/payment', (req, res, next)=>{
    let text = '';
    let markdownText = markdownCache.getCache().get('info-pagamento');
    if (markdownText) {
        text = marked(markdownText);
    }
    res.render('info/payment', {
        nav: {},
        text
    });
})

// How to buy.
router.get('/how-to-buy', (req, res, next)=>{
    let text = '';
    let markdownText = markdownCache.getCache().get('info-como-comprar');
    if (markdownText) {
        text = marked(markdownText);
    }
    res.render('info/howToBuy', {
        nav: {},
        text
    });
})

// Retrun policy.
router.get('/return', (req, res, next)=>{
    let text = '';
    let markdownText = markdownCache.getCache().get('info-devolução');
    if (markdownText) {
        text = marked(markdownText);
    }
    res.render('info/return', {
        nav: {},
        text
    });
})

// Warranty policy.
router.get('/warranty', (req, res, next)=>{
    let text = '';
    let markdownText = markdownCache.getCache().get('info-garantia');
    if (markdownText) {
        text = marked(markdownText);
    }
    res.render('info/warranty', {
        nav: {},
        text
    });
})

// About site.
router.get('/about-site', (req, res, next)=>{
    let text = '';
    let markdownText = markdownCache.getCache().get('info-sobre-o-site');
    if (markdownText) {
        text = marked(markdownText);
    }
    res.render('info/aboutSite', {
        nav: {},
        text
    });
})

// Politics
router.get('/politics', (req, res, next)=>{
    let text = '';
    let markdownText = markdownCache.getCache().get('info-políticas');
    if (markdownText) {
        text = marked(markdownText);
    }
    res.render('info/politics', {
        nav: {},
        text
    });
})

module.exports = router;
