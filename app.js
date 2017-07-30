/* eslint no-unused-vars: 0 */
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
// General log.
const log = require('./bin/log');
// Log transaction.
const morgan = require('morgan');
// Body.
const bodyParser = require('body-parser');
// Mongo.
const dbConfig = require('./bin/dbConfig');
const mongo = require('./model/db');
const ObjectId = require('mongodb').ObjectId;
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
const bcrypt = require('bcrypt');
// Cart.
const Cart = require('./model/cart');
// Paypal
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
// app must be before routes
const app = express();
// routes
const routeUsers = require('./routes/routeUsers');
const routeSite = require('./routes/routeSite');
const routeWsManual = require('./routes/routeWsManual');
const routeWsAllNations = require('./routes/routeWsAllNations');
const routeWsStore = require('./routes/routeWsStore');
const routeConfigProducts = require('./routes/routeConfigProducts');

// Node env.
log.info(`NODE_ENV: ${process.env.NODE_ENV}`);

// transaction log - no log in test mode.
if (app.get('env') !== 'test') {
  app.use(morgan('dev'));
}

// statics
app.use(express.static(path.join(__dirname, 'dist/')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components/')));
app.use('/semantic', express.static(path.join(__dirname, 'semantic/')));

// for cookie and json web token
app.set('secret', 'd7ga8gat3kaz0m');

// pretty in development
if (app.get('env') === 'development') {
  app.locals.pretty = true;
}

// view engine setup
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

// body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// authentication
app.use(cookieParser(app.get('secret')));
app.use(session(sessionOpts));
app.use(csurf());
// app.use(csrf({ cookie: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
// passport.use('local.signup', new LocalStrategy(, )) see youtube Build a Shopping Cart - #7 
passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true }, function (req, email, password, done) {
  // log.warn('LocalStrategy - Redis.');
  // log.warn('req.sessionId: ', req.sessionID);
  redis.get(`user:${email}`, (err, strUser)=>{
    // log.info('strUser: ', strUser);
    if (err) { 
      log.error(`Passport.use - local strategy - Database error: ${err}`); 
      return done(err, false, {message: 'Internal error.'}); 
    }
    // User not found.
    if (!strUser) { 
      log.warn(`email ${email} not found on database.`); 
      return done(null, false, { message: 'Usuário não cadastrado.'} ); 
    }
    let user = JSON.parse(strUser);
    // Password match.
    if (password === user.password){
      // log.warn('new authentication');
      // Merge cart from session.
      redis.get(`cart:${req.sessionID}`, (err, sessCart)=>{
        if (sessCart) {
          // Get authenticated user cart.
          redis.get(`cart:${user.email}`, (err, userCart)=>{
            let cart;
            if (userCart) {
              cart = new Cart(JSON.parse(userCart));
            } else {
              cart = new Cart();
            }
            // Merge anonymous cart to authenticated user cart.
            cart.mergeCart(JSON.parse(sessCart));
            redis.del(`cart:${req.sessionID}`);
            redis.set(`cart:${user.email}`, JSON.stringify(cart), (err)=>{
              // log.warn('merged cart: ', JSON.stringify(cart));
              return done(null, user); 
            });   
          }); 
        }
        // No cart session to merge.
        else {
          return done(null, user); 
        }        
      });
    } 
    // Wrong password.
    else {
      log.warn(`Incorrect password for user ${email}`);
      return done(null, false, { message: 'Senha incorreta.'} ); 
    }
  });
}));

// passport.use(new LocalStrategy(function (username, password, done) {
//   mongo.db.collection(dbConfig.collSession).findOne({username: username}, (err, user)=>{
//     // console.log(`user from db: ${JSON.stringify(user)}`);
//     if (err) { log.error(`Database error: ${err}`); return done(err); }
//     // User not found.
//     if (!user) { log.warn(`User ${username} not found on database.`); return done(null, false, {message: 'Usuario nao cadastrado.'}); }
//     // Verify password.
//     log.info('Before bcrypt compare.');
//     bcrypt.compare(password, user.password, (err, res)=>{
//       if (err) { log.error(`bcrypt error: ${err}`); }
//       // Correct password.
//       if (res) {
//         return done(null, user, {message: `Bem vindo ${user.username}`});
//       // Wrong password.
//       } else {
//         log.warn(`Incorrect password for user ${username}`);
//         return done(null, false, {message: 'Senha incorreta.'});
//       }
//     });
//   });
// }));

// Serialize _id to session, write _id to session.passport.user.
passport.serializeUser(function(user, done) {
  log.info('passport.serialize');
  done(null, user.email);
});

// Deserialize.
passport.deserializeUser(function(id, done) {
  log.info('passport.deserialize');
  // log.info('id: ', id);
  redis.get(`user:${id}`, (err, value)=>{
    // log.info('user: ', value);
    done(null, JSON.parse(value));
  });
});

// Routes.
// Web service - they no need the middleware cart.
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
// Site.
app.use('/', routeSite);

// CSRF error handler.
app.use(function (err, req, res, next) {
  log.warn('CRSF attack!');
  if (err.code !== 'EBADCSRFTOKEN') return next(err)
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
