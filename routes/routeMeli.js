'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const axios = require('axios');
// Internal.
const s = require('../config/s');
// Mercado Livre
const meli = require('../util/meli.js');

// Check permission.
function checkPermission (req, res, next) {
	// Should be admin.
	if (req.isAuthenticated() && req.user.group.includes('admin')) {
		return next();
	}
	// log.warn(req.method, req.originalUrl, ' - permission denied');
	// res.json('status: permission denied');
	res.redirect('/user/signin');
};

// Menu
router.get('/menu', checkPermission, (req, res, next)=>{
    // log.debug(`Run mode: ${process.env.NODE_ENV == 'development'}`);
    res.render('meli/menu', {devMode: process.env.NODE_ENV == 'development'});
});

///////////////////////////////////////////////////////////////////////////////
// authentication
///////////////////////////////////////////////////////////////////////////////
// Get meli authorization code from meli
router.get('/auth-code/authenticate', checkPermission, (req, res, next)=>{
    res.redirect(meli.getAuthorizationURL());
});

// Receive authorization code from mercado livre
router.get('/auth-code/receive/:ok', checkPermission, (req, res, next)=>{
    let message = "Código de autorização do Mercado Livre não foi recebido";
    if (req.params.ok === 'true') {
        message = "Código de autorização do Mercado Livre foi atualizado";
    } 
    res.render('meli/authCode', { message: message });
});

// Export authorization code
router.get('/auth-code/export', s.basicAuth, (req, res, next)=>{
    log.debug(`sending auth code: ${meli.getMeliAuthCode()}`);
    res.send(meli.getMeliAuthCode());
});

// Import authorization code
router.get('/auth-code/import', checkPermission, (req, res, next)=>{
    try {
        axios.get('https://www.zunka.com.br/meli/auth-code/export', {
            headers: {
                "Accept": "application/json", 
            },
            auth: { 
                username: s.zunkaSiteProduction.user, 
                password: s.zunkaSiteProduction.password
            },
        })
            .then(response => {
                if (response.data.err) {
                    log.error(new Error(`Importing mercado livre authorization code. ${response.data.err}`));
                } else {
                    log.debug(`response.data: ${response.data}`);
                    meli.setMeliAuthCode(response.data);
                    return res.render('meli/authCode', { message: 'Código de autorização do Mercado Livre importado' });
                }
            })
            .catch(err => {
                log.error(err.stack);
                return res.status(500).send();
            }); 
    } catch(err) {
        log.error(`Importing mercado livre authorization code. ${err}`);
        return res.status(500).send();
    }
});

///////////////////////////////////////////////////////////////////////////////
// products
///////////////////////////////////////////////////////////////////////////////
// Render list of active products
router.get('/products', checkPermission, async (req, res, next)=>{
    try{
        let url = `${meli.MELI_API_URL}/sites/MLB/search?seller_id=${process.env.MERCADO_LIVRE_USER_ID}`
        // log.debug(`get meli products: ${url}`);

        let response = await axios.get(url);
        if (response.data.err) {
            log.error(response.data.err);
            return next(response.data.err);
        } 
        // log.debug(`response: ${JSON.stringify(response.data, null, 2)}`);
        return res.render('meli/products', { products: response.data.results });
    } catch(err) {
        // log.error(`catch - Getting meli products. ${err.stack}`);
        return next(err)
    }
});

// Render product
router.get('/product/:id', checkPermission, async (req, res, next)=>{
    try{
        // let url = `${meli.MELI_API_URL}/sites/MLB/search?seller_id=${process.env.MERCADO_LIVRE_USER_ID}`
        let url = `${meli.MELI_API_URL}/items/${req.params.id}`
        // todo - comment
        log.debug(`get meli product: ${url}`);

        let response = await axios.get(url);
        if (response.data.err) {
            log.error(response.data.err);
            return next(response.data.err);
        } 
        log.debug(`response: ${JSON.stringify(response.data, null, 2)}`);
        return res.render('meli/product', { product: response.data });
    } catch(err) {
        // log.error(`catch - Getting meli products. ${err.stack}`);
        return next(err)
    }
});

///////////////////////////////////////////////////////////////////////////////
// module
///////////////////////////////////////////////////////////////////////////////
module.exports = router;
