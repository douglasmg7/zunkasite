'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const axios = require('axios');
const FormData = require('form-data');
const util = require('util');
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

// Check token access.
async function checkTokenAccess (req, res, next) {
    let tokenAccess = meli.getMeliTokenAccess();

    // Not token access yet.
    if (!tokenAccess) {
        // Try get from current authorization code.
        tokenAccess = await meli.getMeliTokenAccessFromMeli();
        // Need get authorization code first.
        if (!tokenAccess) {
            return res.redirect(meli.getAuthorizationURL());
        }
    }

    // Check if expired.
    let time_to_expire = tokenAccess.expires_at - Date.now();
    log.debug(`Time to expire (s): ${time_to_expire / 1000}`);

    // Expired.
    if (time_to_expire <= 0) {
        try 
        {
            let url = 
                meli.MELI_TOKEN_URL +
                '?grant_type=refresh_token&' +
                `client_id=${process.env.MERCADO_LIVRE_APP_ID}` +
                `&client_secret=${process.env.MERCADO_LIVRE_SECRET_KEY}` +
                `&refresh_token=${tokenAccess.refresh_token}`; 
            log.debug(`meli refresh url: ${url}`);

            // Refresh token access.
            let response = await axios.post(url);
            // log.debug(`response.data: ${util.inspect(response.data)}`);
            if (response.data.err) {
                log.error(new Error(`Refreshing meli token access. ${response.data.err}`));
                return res.status(500).send();
            } else {
                // // Give 10 seconds less to expire.
                response.data.expires_at = Date.now() + ((response.data.expires_in - 10) * 1000);
                // todo - comment debug
                log.debug(`meli token access refreshed, response.data: ${util.inspect(response.data)}`);
                meli.setMeliTokenAccess(response.data);
                res.locals.tokenAccess = response.data;
                return next();
            }
        } catch(err) {
            if (err.response) {
                // log.debug(`err response status: ${err.response.status}`);
                // log.debug(`err response headers: ${JSON.stringify(err.response.headers, null, 4)}`);
                log.error(`Refreshing meli token access. ${JSON.stringify(err.response.data, null, 4)}`);
                res.status(500).send(`Refreshing meli token access. ${JSON.stringify(err.response.data, null, 4)}`);
                // res.redirect(meli.getAuthorizationURL());
            } else if (err.request) {
                log.error(`Refreshing meli token access. ${JSON.stringify(err.request, null, 4)}`);
                res.status(500).send(`Refreshing meli token access. ${JSON.stringify(err.request, null, 4)}`);
            } else {
                log.error(`Refreshing meli token access. ${err.stack}`);
                res.status(500).send();
            }
        }
    } 
    // Token access not expired.
    else {
        res.locals.tokenAccess = tokenAccess;
        log.debug('*** 1 not expired ***');
        return next();
    }
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

// Export authorization code
router.get('/auth-code/export', s.basicAuth, (req, res, next)=>{
    log.debug(`sending auth code: ${meli.getMeliAuthCode()}`);
    res.send(meli.getMeliAuthCode());
});

// Import authorization code.
router.get('/auth-code/import', checkPermission, async (req, res, next)=>{
    try {
        let response = await axios.get('https://www.zunka.com.br/meli/auth-code/export', {
            headers: {
                "Accept": "application/json", 
            },
            auth: { 
                username: s.zunkaSiteProduction.user, 
                password: s.zunkaSiteProduction.password
            },
        });
        if (response.data.err) {
            log.error(new Error(`Importing mercado livre authorization code. ${response.data.err}`));
        } else {
            log.debug(`Meli authorization code imported from production server: ${response.data}`);
            meli.setMeliAuthCode(response.data);
            // Get token access.
            tokenAccess = await meli.getMeliTokenAccessFromMeli(response.data);
            if (tokenAccess) {
                return res.render('misc/message', { 
                    title: 'Importação do código de autoriazação', 
                    message: 'Token de acesso foi obtido' 
                });
            }
            return res.render('misc/message', { 
                title: 'Importação do código de autoriazação', 
                message: 'Código de autorização do Mercado Livre importado, mas não foi possível obter o token de acesso' 
            });
        }
    } catch(err) {
        log.error(`Importing mercado livre authorization code. ${err.stack}`);
        return res.status(500).send();
    }
});

// Get access code.
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

        // log.debug(`data: ${JSON.stringify(data, null, 4)}`);
        axios.post(meli.MELI_TOKEN_URL, 
            data,
            {
                headers: {
                    'Accept': 'application/json', 
                    'content-type': 'application/x-www-form-urlencoded',
                },
            }
        )
        .then(response => {
            // log.debug(`response.data: ${util.inspect(response.data)}`);
            if (response.data.err) {
                log.error(new Error(`Importing mercado livre authorization code. ${response.data.err}`));
            } else {
                // Give 10 seconds less to expire.
                response.data.expires_at = Date.now() + ((response.data.expires_in - 10) * 1000);
                log.debug(`response.data: ${util.inspect(response.data)}`);
                meli.setMeliTokenAccess(response.data);
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
// Render products.
router.get('/products', checkPermission, checkTokenAccess, async (req, res, next)=>{
    try{
        // log.debug(`res.locals.tokenAccess: ${util.inspect(res.locals.tokenAccess)}`);
        let url = '';
        let privateApi = false;
        // Active products.
        if (req.query.status == 'active') {
            url = `${meli.MELI_API_URL}/sites/MLB/search?seller_id=${process.env.MERCADO_LIVRE_USER_ID}`
        } 
        // All products.
        else {
            privateApi = true;
            url = `${meli.MELI_API_URL}/users/${process.env.MERCADO_LIVRE_USER_ID}/items/search`
            // log.debug(`all selected: ${url}`);
        }

        // log.debug(`token access: ${meli.getMeliTokenAccess().access_token}`);
        let response = await axios.get(url, {
            // headers: {Authorization: `Bearer ${meli.getMeliTokenAccess().access_token}`}
            headers: {Authorization: `Bearer ${res.locals.tokenAccess.access_token}`}
        });
        // log.debug(`response.data: ${util.inspect(response.data)}`);
        if (response.data.err) {
            return log.error(new Error(`Getting all products from  mercado livre. ${response.data.err}`));
        }

        // log.debug(`response: ${util.inspect(response.data, false, 2)}`);
        return res.render('meli/products', { products: response.data.results, privateApi });
    } catch(err) {
        res.status(500).send();
        if (err.response) {
            log.error(`requesting all meli products: ${JSON.stringify(err.response.data, null, 4)}`);
        } else if (err.request) {
            log.error(`requesting all meli products: ${JSON.stringify(err.request, null, 4)}`);
        } else {
            log.error(err.stack);
        }
    }
});

// Render product.
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
