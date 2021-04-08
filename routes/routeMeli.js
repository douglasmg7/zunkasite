'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const axios = require('axios');
const FormData = require('form-data');
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

// get access code
router.get('/access-token', checkPermission, (req, res, next)=>{
    try 
    {
        let authCode = meli.getMeliAuthCode();
        if (!authCode) {
            return res.render('misc/message', { title: 'Chave de acesso', message: 'Não existe código de autorização para obter a chave de acesso'});
        }

        let data = {
            grant_type: 'authorization_code',
            client_id: process.env.MERCADO_LIVRE_APP_ID,
            client_secret: process.env.MERCADO_LIVRE_SECRET_KEY,
            code: authCode,
            redirect_uri: process.env.MERCADO_LIVRE_REDIRECT_URL_ZUNKASITE,
        };

        // let formData = new FormData()
        // formData.append('grant_type', 'authorization_code')
        // formData.append('client_id', process.env.MERCADO_LIVRE_APP_ID)
        // formData.append('client_secret', process.env.MERCADO_LIVRE_SECRET_KEY)
        // formData.append('code', authCode)
        // formData.append('redirect_uri', process.env.MERCADO_LIVRE_REDIRECT_URL_ZUNKASITE)

        // log.debug(`data: ${JSON.stringify(data, null, 4)}`);
        axios.post(meli.MELI_TOKEN_URL, 
            data,
            {
                headers: {
                    'Accept': 'application/json', 
                    'content-type': 'application/x-www-form-urlencoded',
                },
                // auth: { 
                    // username: s.zunkaSiteProduction.user, 
                    // password: s.zunkaSiteProduction.password
                // }, 
            }
        )
        .then(response => {
            log.debug('*** 0 ***');
            log.debug(`response: ${JSON.stringify(response, null, 4)}`);
            // log.debug(`response data: ${response.data}`);
            // log.debug(`response data: ${response.status}`);
            if (response.data.err) {
                log.error(new Error(`Importing mercado livre authorization code. ${response.data.err}`));
            } else {
                log.debug(`response.data: ${response.data}`);
                meli.setMeliAuthCode(response.data);
                return res.send(response.data);
            }
        })
        .catch(err => {
            res.status(500).send();
            // log.debug(`err.response: ${JSON.stringify(err, null, 4)}`);
            if (err.response) {
                // log.debug(`err response status: ${err.response.status}`);
                // log.debug(`err response headers: ${JSON.stringify(err.response.headers, null, 4)}`);
                log.error(`requesting meli access token: ${JSON.stringify(err.response.data, null, 4)}`);
            } else if (err.request) {
                log.error(`requesting meli access token: ${JSON.stringify(err.request, null, 4)}`);
            } else {
                log.error(err.stack);
            }
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
