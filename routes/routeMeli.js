'use strict';
const express = require('express');
const router = express.Router();
const log = require('../config/log');
const axios = require('axios');
const FormData = require('form-data');
const util = require('util');
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const Product = require('../model/product');
const MeliCategory = require('../model/meliCategory');
const redis = require('../util/redisUtil');
const productCategories = require('../util/productCategories');
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
    log.debug(`Time to expire meli token (min): ${Math.floor(time_to_expire / 60000)}`);

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
        // log.debug('Meli token not expired');
        return next();
    }
};

// Menu
router.get('/menu', checkPermission, async (req, res, next)=>{
    try {
        // log.debug(`Run mode: ${process.env.NODE_ENV == 'development'}`);
        let autoLoadTokenAccess = await redis.getMeliAutoLoadTokenAccess();
        // log.debug(`autoLoadTokenAccess: ${autoLoadTokenAccess}`);
        res.render('meli/menu', {devMode: process.env.NODE_ENV == 'development', autoLoadTokenAccess});
    } catch(err) {
        log.error(`Getting meli menu page. ${err.stack}`);
        return res.status(500).send();
    }
});

///////////////////////////////////////////////////////////////////////////////
// authentication
///////////////////////////////////////////////////////////////////////////////
// Get meli authorization code from meli.
router.get('/auth-code/authenticate', checkPermission, (req, res, next)=>{
    res.redirect(meli.getAuthorizationURL());
});

// Export authorization code.
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
            let tokenAccess = await meli.getMeliTokenAccessFromMeli(response.data);
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

// Set auto load token access.
router.post('/access-token/auto-load-token-access', checkPermission, (req, res, next)=>{
    try {
        // log.debug(`req: ${util.inspect(req.body)}`);
        redis.setMeliAutoLoadTokenAccess(req.body.autoLoadTokenAccess);
        res.json({success: true}); 
    } catch(err) {
        log.error(`Saving auto load token access configuration. ${err.stack}`);
        res.json({success: false}); 
    }
});

// // Get access code.
// router.get('/access-token', checkPermission, (req, res, next)=>{
    // try 
    // {
        // let authCode = meli.getMeliAuthCode();
        // if (!authCode) {
            // return res.render('misc/message', { title: 'Chave de acesso', message: 'Não existe código de autorização para obter a chave de acesso'});
        // }

        // let data = {
            // grant_type: 'authorization_code',
            // client_id: process.env.MERCADO_LIVRE_APP_ID,
            // client_secret: process.env.MERCADO_LIVRE_SECRET_KEY,
            // code: authCode,
            // redirect_uri: process.env.MERCADO_LIVRE_REDIRECT_URL_ZUNKASITE,
        // };

        // // log.debug(`data: ${JSON.stringify(data, null, 4)}`);
        // axios.post(meli.MELI_TOKEN_URL, 
            // data,
            // {
                // headers: {
                    // 'Accept': 'application/json', 
                    // 'content-type': 'application/x-www-form-urlencoded',
                // },
            // }
        // )
        // .then(response => {
            // // log.debug(`response.data: ${util.inspect(response.data)}`);
            // if (response.data.err) {
                // log.error(new Error(`Importing mercado livre authorization code. ${response.data.err}`));
            // } else {
                // // Give 10 seconds less to expire.
                // response.data.expires_at = Date.now() + ((response.data.expires_in - 10) * 1000);
                // log.debug(`response.data: ${util.inspect(response.data)}`);
                // meli.setMeliTokenAccess(response.data);
                // return res.send(response.data);
            // }
        // })
        // .catch(err => {
            // res.status(500).send();
            // // log.debug(`err.response: ${JSON.stringify(err, null, 4)}`);
            // if (err.response) {
                // // log.debug(`err response status: ${err.response.status}`);
                // // log.debug(`err response headers: ${JSON.stringify(err.response.headers, null, 4)}`);
                // log.error(`requesting meli access token: ${JSON.stringify(err.response.data, null, 4)}`);
            // } else if (err.request) {
                // log.error(`requesting meli access token: ${JSON.stringify(err.request, null, 4)}`);
            // } else {
                // log.error(err.stack);
            // }
        // }); 
    // } catch(err) {
        // log.error(`Importing mercado livre authorization code. ${err}`);
        // return res.status(500).send();
    // }
// });

// Export token access.
router.get('/access-token', s.basicAuth, checkTokenAccess, (req, res, next)=>{
    res.send(res.locals.tokenAccess.access_token);
});


///////////////////////////////////////////////////////////////////////////////
// products
///////////////////////////////////////////////////////////////////////////////

// Render meli product.
router.get('/product/:id', checkPermission, async (req, res, next)=>{
    try{
        // let url = `${meli.MELI_API_URL}/sites/MLB/search?seller_id=${process.env.MERCADO_LIVRE_USER_ID}`
        let url = `${meli.MELI_API_URL}/items/${req.params.id}`
        // log.debug(`get meli product: ${url}`);

        let response = await axios.get(url);
        if (response.data.err) {
            log.error(response.data.err);
            return next(response.data.err);
        } 
        // log.debug(`response: ${JSON.stringify(response.data, null, 2)}`);
        log.debug(`response: ${response.data.id}`);
        return res.render('meli/product', { product: response.data });
    } catch(err) {
        // log.error(`catch - Getting meli products. ${err.stack}`);
        return next(err)
    }
});

// Get meli product.
router.get('/products/:mercadoLivreId', checkPermission, async (req, res, next)=>{
    function error(message) {
        log.error(`requesting meli products ${req.params.mercadoLivreId}. ${message}`);
    }
    try{
        // let url = `${meli.MELI_API_URL}/sites/MLB/search?seller_id=${process.env.MERCADO_LIVRE_USER_ID}`
        let url = `${meli.MELI_API_URL}/items/${req.params.mercadoLivreId}`
        // log.debug(`url: ${url}`);

        let response = await axios.get(url);
        if (response.data.err) {
            error(response.data.err);
            return next(response.data.err);
        } 
        // log.debug(`response: ${JSON.stringify(response.data, null, 2)}`);
        // log.debug(`response: ${response.data.id}`);
        return res.send(response.data);
    } catch(err) {
        res.status(500).send();
        if (err.response) {
            error(JSON.stringify(err.response.data, null, 4));
        } else if (err.request) {
            error(JSON.stringify(err.request, null, 4));
        } else {
            error(err.stack);
        }
    }
});

// Get all meli products.
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

// Create meli product.
router.post('/products', checkPermission, checkTokenAccess, async (req, res, next)=>{
    // Util for message erros.
    function error(message) {
        log.error(`Creating meli product. ${message}`);
    }
    try {
        // log.debug(`body: ${JSON.stringify(req.body.productsId)}`);
        // Missing product id.
        if (!req.body.productId) {
            return res.status(400).send('Missing productId');
        }
        // Missing meli category id.
        if (!req.body.categoryId) {
            return res.status(400).send('Missing categoid');
        }
        // Invalid productId.
        let productId = '';
        try {
            productId = mongoose.Types.ObjectId(req.body.productId);
        } catch(err){
            return res.status(400).send(`Inválid productId: ${req.body.productId}`);
        }
        // Get product from db.
        let product = await Product.findOne({_id: ObjectId(productId)}).exec();
        if (!product) return res.status(400).send(`Not found product for productId: ${req.body.productId}`);
        // log.debug(product);


        let data = {
            seller_custom_field: `${product._id}`, 
            title: product.storeProductTitle,
            category_id: req.body.categoryId,
            // price: meliPrice,
            currency_id: "BRL",
            available_quantity: product.storeProductQtd,
            buying_mode: "buy_it_now",
            condition: "new",
            // sale_terms:[
                // {
                    // "id":"WARRANTY_TYPE",
                    // "value_name":"Garantía del vendedor"
                // },
                // {
                    // "id":"WARRANTY_TIME",
                    // "value_name":"90 días"
                // }
            // ],
        }

        // Define price.
        // Classic.
        if (req.body.meliListingType == 'gold_special') {
            data.listing_type_id = "gold_special",
            data.price = Math.round(product.storeProductPrice * 112) / 100;
        } 
        // Premium.
        else {
            data.listing_type_id = "gold_pro",
            data.price = Math.round(product.storeProductPrice * 117) / 100;
        }
        log.debug(`req.body.meliListingType: ${util.inspect(req.body)}`);

        // Attributes.
        data.attributes = [];
        for (const attribute of req.body.attributes) {
            data.attributes.push({ id: attribute.id, value_name: attribute.text });
        }
        // Images.
        data.pictures = [];
        for (const image of product.images) {
            data.pictures.push({ source: `https://${req.app.get('hostname')}/img/${product._id}/${image}` });
        }

        log.debug(`data: ${util.inspect(data)}`);
        // Uncomment to disable.
        // return res.send();

        // log.debug(`data: ${JSON.stringify(data, null, 4)}`);
        let response = await axios.post(`${meli.MELI_API_URL}/items`, data, { headers: { Authorization: `Bearer ${res.locals.tokenAccess.access_token}`, }, });
        // log.debug(`response.data: ${util.inspect(response.data)}`);
        if (response.data.err) {
            log.error(new Error(`${errPre} ${response.data.err}`));
            return res.status(500).send();
        }
        log.debug(`creating meli product response.data: ${util.inspect(response.data)}`);
        log.debug('before save');
        log.debug(`mercadoLivreId: ${response.data.id}`);
        product.mercadoLivreId = response.data.id;
        await product.save();
        log.debug('after save');
        // Add desctiption to meli product.
        // Description must be created only after product was created.
        setTimeout(
            async function() { 
                let responseDesc = await axios.post(
                    `${meli.MELI_API_URL}/items/${product.mercadoLivreId}/description?api_version=2`, 
                    { "plain_text": createDescription(product.storeProductTechnicalInformation) },
                    { 
                        headers: { 
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${res.locals.tokenAccess.access_token}`, 
                        }, 
                    }
                );
                log.debug(`responseDesc.data: ${util.inspect(responseDesc.data)}`);
                if (responseDesc.data.err) {
                    log.error(new Error(`${errPre} ${responseDesc.data.err}`));
                }
            }, 10000
        );
        return res.send({mercadoLivreId: response.data.id});
    } catch(err) {
        if (err.response) {
            error(JSON.stringify(err.response.data, null, 4));
        } else if (err.request) {
            error(JSON.stringify(err.response, null, 4));
        } else {
            error(err.stack);
        }
        res.status(500).send(err);
    }
});

// Update meli product.
router.put('/products/:productId', checkPermission, checkTokenAccess, async (req, res, next)=>{
    function error(message) {
        log.error(`Updating meli product. ${message}`);
    }
    try {
        // Invalid productId.
        let productId = '';
        try {
            productId = mongoose.Types.ObjectId(req.params.productId);
        } catch(err){
            return res.status(400).send(`Inválid productId: ${req.params.productId}`);
        }
        // Get product from db.
        let product = await Product.findOne({_id: ObjectId(productId)}).exec();
        if (!product) return res.status(400).send(`Not found product for productId: ${req.body.productId}`);
        if (!product.mercadoLivreId) return res.status(400).send(`Not found assoiciated mercado livre id for product for productId: ${req.body.productId}`);
        // log.debug(product);

        // return res.send();

        // log.debug(`data: ${JSON.stringify(data, null, 4)}`);
        let data;
        switch (req.body.status) {
            case 'paused':
            case 'active':
            case 'closed':
                data = {status: req.body.status};
                break;
            case 'deleted':
                data = {deleted: true};
                break;
            default:
                return res.status(400).send(`Invalid status: ${req.body.status}`);
        }

        // Update status.
        let response = await axios.put(`${meli.MELI_API_URL}/items/${product.mercadoLivreId}`, 
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${res.locals.tokenAccess.access_token}`,
                },
            }
        );
        // log.debug(`response.data: ${util.inspect(response.data)}`);
        if (response.data.err) {
            log.error(new Error(`${errPre} ${response.data.err}`));
            return res.status(500).send();
        } else {
            // log.debug(`Updating meli product response.data: ${util.inspect(response.data)}`);
            log.debug(`Meli product updated to status: ${req.body.status}`);
            return res.send();
        }
    } catch(err) {
        if (err.response) {
            error(JSON.stringify(err.response.data, null, 4));
        } else if (err.request) {
            error(JSON.stringify(err.response, null, 4));
        } else {
            error(err.stack);
        }
        res.status(500).send();
    }
});

///////////////////////////////////////////////////////////////////////////////
// User test
///////////////////////////////////////////////////////////////////////////////
// Create user test.
router.get('/user', checkPermission, checkTokenAccess, async (req, res, next)=>{
    try{
        // log.debug(`res.locals.tokenAccess: ${util.inspect(res.locals.tokenAccess)}`);
        url = `${meli.MELI_API_URL}/users/test_user`
        let data = {
            site_id: "MLB"    
        }
        // log.debug(`token access: ${meli.getMeliTokenAccess().access_token}`);
        let response = await axios.post(url, data, {
            // headers: {Authorization: `Bearer ${meli.getMeliTokenAccess().access_token}`}
            headers: {Authorization: `Bearer ${res.locals.tokenAccess.access_token}`}
        });
        // log.debug(`response.data: ${util.inspect(response.data)}`);
        if (response.data.err) {
            return log.error(new Error(`Creating  Mercado Livre user test. ${response.data.err}`));
        }
        log.debug(`user test: ${util.inspect(response.data)}`);

        // log.debug(`response: ${util.inspect(response.data, false, 2)}`);
        return res.render('misc/message', {title: 'Criação de usuário de teste do Mercado Livre', message: util.inspect(response.data)});

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

///////////////////////////////////////////////////////////////////////////////
// Categories
///////////////////////////////////////////////////////////////////////////////
// Add category.
router.get('/add-category/:categoryId', checkPermission, async (req, res, next)=>{
    try {
        let url = `${meli.MELI_API_URL}/categories/${req.params.categoryId}`

        let [zunkaCategory, meliCategory] = await Promise.all([
            MeliCategory.findOne({ 'id': req.params.categoryId }), 
            await axios.get(url)
        ]);

        // Only show button if not category exists.
        let showAddCategoryButton = true;
        if (zunkaCategory) { showAddCategoryButton = false };
        // log.debug(`category: ${util.inspect(category)}`);
        // log.debug(`attributes: ${util.inspect(attributes)}`);

        if (meliCategory.data.err) {
            log.error(meliCategory.data.err);
            return next(meliCategory.data.err);
        } 

        return res.render('meli/addCategory', { category: meliCategory.data, showAddCategoryButton: showAddCategoryButton });



        // // log.debug(`categoryId: ${req.params.categoryId}`);
        // let category = await MeliCategory.findOne({ 'id': req.params.categoryId }).exec()
        // if (!category) {
            // return res.status(500).send('Categoria não existe');
        // }




        // let response = await axios.get(url);
        // if (response.data.err) {
            // log.error(response.data.err);
            // return next(response.data.err);
        // } 

        // return res.render('meli/findCategory', { category: response.data });
    } catch(err) {
        return next(err)
    }
});

// Render categories.
router.get('/categories', checkPermission, async (req, res, next)=>{
    try{
        let categories = await MeliCategory.find().exec();
        return res.render('meli/categories', { categories: categories });
    } catch(err) {
        return next(err)
    }
});

// Render category.
router.get('/categories/:categoryId', checkPermission, async (req, res, next)=>{
    try{
        // log.debug(`categoryId: ${req.params.categoryId}`);
        let category = await MeliCategory.findOne({ 'id': req.params.categoryId }).exec()
        if (!category) {
            return res.status(500).send('Categoria não existe');
        }
        // log.debug(`category: ${util.inspect(category)}`);
        // log.debug(`productCategories.categories: ${util.inspect(productCategories.categories)}`);
        return res.render('meli/category', { category: category, productCategories: productCategories.categories });
    } catch(err) {
        return next(err)
    }
});


// Add category.
router.post('/categories', checkPermission, async (req, res, next)=>{
    try {
        // Invalid category.
        let categoryId = req.body.categoryId
        // log.debug(`req.body: ${util.inspect(req.body)}`);
        if (!categoryId || !categoryId.startsWith('MLB') || (categoryId.length <= 4)) {
            return res.status(400).send('Catgoria inválida');
        }
        // Category already exist.
        let existCategory = await MeliCategory.findOne({ 'id': categoryId }).exec()
        if (existCategory) {
            return res.status(400).send('Categoria já foi adicionada anteriormente');
        }
        let [category, attributes] = await Promise.all([meli.getMeliCategory(categoryId), meli.getMeliCategoryAttributes(categoryId)]);
        // log.debug(`category: ${util.inspect(category)}`);
        // log.debug(`attributes: ${util.inspect(attributes)}`);
        if (!category || !attributes) {
            log.error(new Error(`Adding Mercado Livre category ${categoryId}. Not receive category or category attributes.`));
            return res.status(500).send('Erro interno');
        }
        category = MeliCategory(category);
        category.attributes = attributes;
        category.zunkaCategory = await productCategories.getSimilarCategory(category.name);        

        await category.save()
        log.debug(`Meli category ${category.name} added`);
        return res.send();
    } catch(err) {
        log.error(`Adding meli category. ${err.stack}`);
        return res.status(500).send('Erro interno');
    }
});

// Remove category.
router.delete('/categories/:categoryId', checkPermission, async (req, res, next)=>{
    try {
        // log.debug(`response.data: ${util.inspect(response.data)}`);
        await MeliCategory.deleteOne({ id: req.params.categoryId });
        log.debug(`Meli category ${req.params.categoryId} deleted`);
        return res.send();
    } catch(err) {
        log.error(`Adding meli category. ${err.stack}`);
        return res.status(500).send('Erro interno');
    }
});

// Update zunka category.
router.put('/categories/:categoryId/zunka-category', checkPermission, async (req, res, next)=>{
    try {
        // Invalid category.
        let categoryId = req.params.categoryId
        // log.debug(`req.body: ${util.inspect(req.body)}`);
        if (!categoryId || !categoryId.startsWith('MLB') || (categoryId.length <= 4)) {
            return res.status(400).send('Catgoria inválida');
        }
        let dbCategory = await MeliCategory.findOne({ id: categoryId });
        if (!dbCategory) {
            return res.status(400).send(`Not exist category: ${categoryId} to be updated`);
        }

        // Validate zunka category.
        // log.debug(`req.body: ${util.inspect(req.body)}`);
        let zunkaCategory = req.body.productCategory;
        if (!zunkaCategory) {
            return res.status(400).send('Zunka categoria inválida');
        }
        if (!productCategories.categories.includes(zunkaCategory)) {
            return res.status(400).send('Zunka categoria não existe');
        }

        // Update.
        dbCategory.zunkaCategory = zunkaCategory;
        await dbCategory.save();
        log.debug(`Meli category ${dbCategory.name} updated to zunka category ${dbCategory.zunkaCategory}`);
        return res.send();
    } catch(err) {
        log.error(`Updating meli zunka category. ${err.stack}`);
        return res.status(500).send('Erro interno');
    }
});

// Update category.
router.put('/categories/:categoryId', checkPermission, async (req, res, next)=>{
    try {
        // Invalid category.
        let categoryId = req.params.categoryId
        // log.debug(`req.body: ${util.inspect(req.body)}`);
        if (!categoryId || !categoryId.startsWith('MLB') || (categoryId.length <= 4)) {
            return res.status(400).send('Catgoria inválida');
        }
        let dbCategory = await MeliCategory.findOne({ id: categoryId });
        if (!dbCategory) {
            return res.status(400).send(`Not exist category: ${categoryId} to be updated`);
        }

        let [category, attributes] = await Promise.all([meli.getMeliCategory(categoryId), meli.getMeliCategoryAttributes(categoryId)]);
        if (!category || !attributes) {
            log.error(new Error(`Adding Mercado Livre category ${categoryId}. Not receive category or category attributes.`));
            return res.status(500).send('Erro interno');
        }
        category.attributes = attributes;
        // Will no change zunka category already defined.
        category.zunkaCategory = dbCategory.zunkaCategory;

        dbCategory.overwrite(category);
        await dbCategory.save()
        log.debug(`Meli category ${dbCategory.name} updated`);
        return res.send();
    } catch(err) {
        log.error(`Updating meli category. ${err.stack}`);
        return res.status(500).send('Erro interno');
    }
});


// Get meli category attributes by zunka product category.
router.get('/category/attributes-by-zunka-product-category/:zunkaProductCategory', checkPermission, async (req, res, next)=>{
    try{
        // log.debug(`req.params.zunkaProductCategory: ${req.params.zunkaProductCategory}`);
        let category = await MeliCategory.findOne({ 'zunkaCategory': req.params.zunkaProductCategory }).exec()
        // log.debug(`category.attributes: ${util.inspect(category.attributes)}`);
        if (category && category.attributes && (category.attributes.length > 0)) {
            return res.json({ meliCategoryId: category.id, meliCategories: category.attributes });
        }
        return res.json({});
    } catch(err) {
        log.error(`Getting meli category attribute by zunka product category. ${err.stack}`);
        return res.status(500).send(err);
    }
});

//////////////////////////////////////////////////////////////////////////////
// Util
///////////////////////////////////////////////////////////////////////////////
function createDescription(text) {
    let description = '';
    text = text.toString().trim();
    if (text == '') { return description; }
    text.split('\n').forEach(line=>{
        if (line.includes(';')) {
            line.split(';').forEach(item=>{
                description += `${item}\n`;
            });
            description += '\n';
        } else {
            description += `${line}\n\n`;
        }
    });
    // log.debug(description);
    return description;
}


//////////////////////////////////////////////////////////////////////////////
// module
///////////////////////////////////////////////////////////////////////////////
module.exports = router;
