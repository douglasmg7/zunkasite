/* eslint no-unused-vars: 0 */
'use strict';
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
// General log.
const log = require('./config/log');
// Log transaction.
const morgan = require('morgan');
// Body.
const bodyParser = require('body-parser');
// Validation.
const validator = require('express-validator');
const cpfValidator = require('gerador-validador-cpf');
// Mongo.
const dbConfig = require('./config/db');
const mongo = require('./model/db');
const ObjectId = require('mongodb').ObjectId;
const mongoose = require('./model/mongoose');
// Redis.
const redis = require('./model/redis');
// Authentication.
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const session = require('express-session');
const flash = require('connect-flash');
// const MongoStore = require('connect-mongo')(session);
const redisStore = require('connect-redis')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt-nodejs');
// Cart.
const Cart = require('./model/cart');
// Paypal.
// const paypal = require('paypal-rest-sdk');
// Webpack HMR - hot module reload.
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const compiler = webpack(webpackConfig);
const webpackDevMiddleware = require('webpack-dev-middleware')(compiler, {
  noInfo: false, 
  publicPath: webpackConfig.output.publicPath, 
  stats: {colors: true, chunks: false}
});
const webpackHotMiddleware = require('webpack-hot-middleware')(compiler);
// App must be before routes.
const app = express();
// Routes.
const routeUsers = require('./routes/routeUsers');
const routeSite = require('./routes/routeSite');
const routeWsManual = require('./routes/routeWsManual');
const routeWsAllNations = require('./routes/routeWsAllNations');
const routeWsStore = require('./routes/routeWsStore');
const routeConfigProducts = require('./routes/routeConfigProducts');
const routeTest = require('./routes/routeTest');

// Node env.
log.info(`NODE_ENV: ${process.env.NODE_ENV}`);

// Transaction log - no log in test mode.
if (app.get('env') !== 'test') {
  app.use(morgan('dev'));
}

// Statics
app.use(express.static(path.join(__dirname, 'dist/')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components/')));
app.use('/semantic', express.static(path.join(__dirname, 'semantic/')));

// For cookie and json web token
app.set('secret', 'd7ga8gat3kaz0m');

// Pretty in development
if (app.get('env') === 'development') {
  app.locals.pretty = true;
}

// View engine setup.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Passport does not directly manage your session, it only uses the session.
// So you configure session attributes (e.g. life of your session) via express
// define which db to use.
let dbUrl = null;
app.get('env') === 'test' ? dbUrl = dbConfig.urlUnitTest : dbUrl = dbConfig.url;
var sessionOpts = {
  secret: app.get('secret'),
  resave: false, // Save just when changed.
  saveUninitialized: false, // Create if have some thing.
  cookie: { maxAge: 2419200000 }, // configure when sessions expires in ms.
  store: new redisStore({ client: redis })   // Use a current connection.
  // store: new MongoStore({ url: dbUrl })   // Use a current connection.
};
// if (app.get('env') === 'production') {
//   app.set('trust proxy', 1); // trust first proxy
//   sessionOpts.cookie.secure = true; // serve secure cookies
// }

// webpack HMR
app.use(webpackDevMiddleware);
app.use(webpackHotMiddleware);
// body.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// Validation.
app.use(validator({
  customValidators: {
    isCpf: function(value){ return cpfValidator.validate(value); }
  }
}));

// authentication
app.use(cookieParser(app.get('secret')));
app.use(session(sessionOpts));
// // Debug.
// app.use((req, res, next)=>{
//   // Log request.
//   log.warn('REQUEST: ', req.method + ' - ' + req.path);
//   log.warn('headers: ', req.headers);
//   log.warn('body: ', JSON.stringify(req.body));
//   next();
// });

app.use(csurf());
// app.use(csrf({ cookie: true }));
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
  next();
});

// Routes.
// Web service - they no need the cart middleware.
app.use('/ws/manual', routeWsAllNations);
app.use('/ws/allnations', routeWsAllNations);
app.use('/ws/store', routeWsStore);

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
        if (err) { log.error(err, new Error().stack) ;}
      });
    }
  })  
});

// Routes.
// Users.
app.use('/users', routeUsers);
// Products configuration.
app.use('/configProducts', routeConfigProducts);
// Test.
app.use('/test', routeTest);
// Site.
app.use('/', routeSite);

// CSRF error handler.
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)
  log.warn('CRSF attack!');
  res.status(403).send('Form tampered!');
})

// Error handlers.
app.use(function(err, req, res, next) {
  res.status(500).send({error: 'Internal server error.'});
  log.error(err.stack);
});

// // Development error handler.
// // Will print stacktrace.
// if (app.get('env') === 'development') {
//   app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {      
//       message: err.message,
//       error: err
//     });
//   });
// // Production error handler.
// // No stacktraces leaked to user.  
// } else {
//   app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: {}
//     });
//   });  
// }

// Catch 404 and forward to error handler.
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// function authenticationMiddleware () {
//   return function (req, res, next) {
//     if (req.isAuthenticated()) {
//       return next();
//     }
//     res.redirect('/');
//   };
// }

module.exports = app;
