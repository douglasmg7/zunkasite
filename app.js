/* eslint no-unused-vars: 0 */
'use strict';
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
// General log.
const log = require('./config/log');
const HOSTNAME = 'www.zunka.com.br';
// Run mode.
if (process.env.NODE_ENV == 'development') {
  log.info(`Starting app in development mode.`);
} else if (process.env.NODE_ENV == 'production'){
  log.info(`Starting app in production mode.`);
} else {
  log.info(`Starting app with run mode not defined.`);
}
// Log transaction.
const morgan = require('morgan');
// Body.
const bodyParser = require('body-parser');
// Stylus.
const stylus = require('stylus');
// Validation.
const validator = require('express-validator');
const cpfValidator = require('gerador-validador-cpf');
// Rollup.
const rollup  = require('express-middleware-rollup');

// // Mongo.
// const dbConfig = require('./config/db');
// const mongo = require('./db/mongo');
// const ObjectId = require('mongodb').ObjectId;

// Mongoose.
const mongoose = require('./db/mongoose');

// Redis.
const redis = require('./db/redis');

// Authentication.
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const session = require('express-session');
const flash = require('connect-flash');

const redisStore = require('connect-redis')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt-nodejs');

// Cart.
const Cart = require('./model/cart');

// Not need here, just to turn off npm-check warning.
const debug = require('debug');
const pug = require('pug');

// App must be before routes.
const app = express();
// Routes.
const routeUser = require('./routes/routeUser');
const routeSite = require('./routes/routeSite');
const routeInfo = require('./routes/routeInfo');
const routeCheckout = require('./routes/routeCheckout');
// const routeWsAllNations = require('./routes/routeWsAllNations');
// const routeWsStore = require('./routes/routeWsStore');
const routeProductConfig = require('./routes/routeProductConfig.js');
const routeTest = require('./routes/routeTest');
const routeAdmin = require('./routes/routeAdmin');

// Run mode.
if (process.env.NODE_ENV == 'production') {
  app.set('hostname', HOSTNAME);
} else {
  app.set('hostname', 'localhost');
}

// Transaction log - no log in test mode.
if (app.get('env') !== 'test') {
  app.use(morgan('dev'));
}

// For cookie and json web token.
app.set('secret', 'd7ga8gat3kaz0m');
// Pretty in development.
if (app.get('env') === 'development') {
  app.locals.pretty = false;  // Avoid extra whitespace on HTML rendered by pug.
}

// View engine setup.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// Stylus.
app.use(stylus.middleware({
    src: __dirname + '/styl',
    dest: __dirname + '/dist/css',
    compile: function compile(str, path){
      return stylus(str).set('filename', path);
      }
    })
);

// Livereload.
if (app.get('env') === 'development') {
  log.info('Starting Livereload.');
  const livereload = require('livereload');
  let livereloadServer = livereload.createServer({debug: false, exts: ['pug', 'styl', 'js', 'bundle']});
  livereloadServer.watch([__dirname + "/views", __dirname + "/styl", __dirname + "/dist/js", __dirname + "/scripts"]);  
}

// Rollup.
app.use(rollup({
  src: 'scripts',
  dest: 'dist/js',
  root: __dirname,
  prefix: '/js',
  bundleOpts: { format: 'cjs' },
  // Import mode in not use too.
  rollupOpts: { treeshake: false }
}));

// Statics files.
app.use(express.static(path.join(__dirname, 'dist/')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components/')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules/')));

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(favicon(path.join(__dirname, 'dist', 'favicon.png')));

// // webpack HMR
// app.use(webpackDevMiddleware);
// app.use(webpackHotMiddleware);

// body.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Session options.
var sessionOpts = {
  secret: app.get('secret'),
  resave: false, // Save just when changed.
  saveUninitialized: false, // Create if have some thing.
  cookie: { maxAge: 2419200000 }, // configure when sessions expires in ms.
  store: new redisStore({ client: redis })
};

// if (app.get('env') === 'production') {
//   app.set('trust proxy', 1); // trust first proxy
//   sessionOpts.cookie.secure = true; // serve secure cookies
// }

// authentication
app.use(cookieParser(app.get('secret')));
app.use(session(sessionOpts));
app.use(csurf());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport');

// Set vars for using in views.
app.use((req, res, next)=>{
  // log.debug('Generated csrfToken: ', req.csrfToken());
  res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.user ? req.user : { name: undefined, group: undefined };
  res.locals.path = req.path;
  redis.get('categoriesInUse', (err, categories)=>{
    // Internal error.
    if (err) { 
      log.error(err.stack);
      return res.render('/error', { message: 'Não foi possível encontrar as categorias.', error: err });
    } 
    res.locals.categories = JSON.parse(categories) || []
    next();
  });  
});

// Validation.
app.use(validator({
  customValidators: {
    isCpf: function(value){ return cpfValidator.validate(value); },
    // isCep: function(value){ return value.match(/^\d{8}$/); }
    isCep: function(value){ return value.match(/^\d{5}-\d{3}$/); }
  }
}));

// // Routes.
// // Web service - they no need the cart middleware.
// app.use('/ws/allnations', routeWsAllNations);
// app.use('/ws/store', routeWsStore);

// Cart.
app.use(function(req, res, next) {
  // log.warn('req.sessionID: ', req.sessionID);
  // Get cart.
  let cartKey = req.isAuthenticated() ? req.user.email : req.sessionID;
  redis.get(`cart:${cartKey}`, (err, value)=>{
    if (value) {
      req.cart = new Cart(JSON.parse(value));
    } else {
      req.cart = new Cart();
    }
    // To use in the views.
    res.locals.cart = req.cart;
    next();
  }); 
  // Save cart when the response finish.
  res.on('finish', function(){
    if (req.cart.changed) {
      let cartKey = req.isAuthenticated() ? req.user.email : req.sessionID;
      redis.set(`cart:${cartKey}`, JSON.stringify(req.cart), (err)=>{
        if (err) { log.error(new Error(err).stack) ;}
      });
    }
  })  
});

// Routes.
// Users.
app.use('/user', routeUser);
app.use('/product-config', routeProductConfig);
app.use('/test', routeTest);
app.use('/', routeSite);
app.use('/info', routeInfo);
app.use('/checkout', routeCheckout);
app.use('/admin', routeAdmin);
// CSRF error handler.
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  log.warn('CRSF attack!');
  res.status(403).send('CRSF attack!');
})

// Production error handler (using default error handle for development).
if (app.get('env') !== 'development') {
  app.use(function(err, req, res, next) {
    log.error(err.stack);
    res.status(err.status || 500).render('error/500');
  });  
}

// Catch 404.
app.use(function(req, res, next) {
  res.status(404).send('Página não encontrada.');
});

module.exports = app;
