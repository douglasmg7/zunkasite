'use strict';
const express = require('express');
const redis = require('../db/redis');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// Personal modules.
const log = require('../config/log');
const User = require('../model/user');
const RemovedUser = require('../model/removedUser');
const EmailConfirmation = require('../model/emailConfirmation');
const PasswordReset = require('../model/passwordReset');
const Address = require('../model/address');

// Quantity of orders per page.
const ORDER_QTD_BY_PAGE = 3;

// Transporter object using the default SMTP transport.
let transporter = nodemailer.createTransport({
    host: 'smtps.dialhost.com.br',
    port: 587,
    // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'dev@zunka.com.br',
        pass: 'SergioMiranda1'
    }
});

// Signup page.
router.get('/signup', checkNotLogged, (req, res, next)=>{
  res.render('signup', req.flash());
});

// Signup request.
router.post('/signup', checkNotLogged, passport.authenticate('local.signup', {
  successRedirect: '/users/login',
  failureRedirect: '/users/signup',
  badRequestMessage: 'Campo(s) não preenchidos.',
  failureFlash: true
}));

// Login page.
router.get('/login', checkNotLogged, (req, res, next)=>{
  res.render('login', req.flash());
});

// Confirm signup.
router.get('/login/:token', (req, res, next)=>{
  EmailConfirmation.findOne({ token: req.params.token }, (err, emailConfirmation)=>{
    // Internal error.
    if (err) { 
      log.error(err, Error().stack);
      req.flash('error', 'Serviço indisponível.');
      return res.redirect('/users/login/');
    }  
    // Found Email confirmation.    
    if (emailConfirmation) { 
      // Create the new user.
      let newUser = new User();
      newUser.name = emailConfirmation.name;
      newUser.email = emailConfirmation.email;
      newUser.password = emailConfirmation.password;
      newUser.group = ['client'];
      // newUser.group = ['admin'];
      newUser.status = 'active';
      // Save.
      newUser.save((err, result)=>{
        if (err) { 
          log.error(err, new Error().stack);
          res.falsh('error', 'Não foi possível confirmar o cadastro.\nFavor entrar em contato com o suporte técnico.');
          res.redirect('/users/login/');
        }
        emailConfirmation.remove(err=>{ if (err) { log.error(err, new Error().stack); } });
        req.flash('success', 'Cadastro finalizado com sucesso.');
        res.redirect('/users/login/');          
      });  
    } 
    // No email confirmation.
    else {
      req.flash('error', 'Solicitação de criação de conta expirou.');
      return res.redirect('/users/login/');    
    }  
  })     
});

// Login request.
router.post('/login', checkNotLogged, passport.authenticate('local.signin', {
  successRedirect: '/',
  failureRedirect: 'login',
  badRequestMessage: 'Falta credenciais.',
  failureFlash: true
}));

// logout.
router.get('/logout', (req, res, next)=>{
  console.log(`req.user: ${JSON.stringify(req.user)}`);
  if (req.isAuthenticated()) {
    req.logout();
    res.redirect('/users/login');
  } else {
    res.redirect('/users/login');
  }
});

// Forgot password page.
router.get('/forgot', checkNotLogged, (req, res, next)=>{
  res.render('forgot', req.flash());
});

// Forgot password.
router.post('/forgot', (req, res, next)=>{
  // Validation.
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    else {
      User.findOne({ email: req.body.email }, (err, user)=>{
        // No exist.
        if(!user){
          req.flash('error', `O email ${req.body.email} não está cadastrado no sistema.`);
          res.redirect('back');
          return;
        }        
        // Create token.
        crypto.randomBytes(20, function(err, buf) {
          if (err) { 
            log.error(err, new Error().stack);
            req.flash('error', 'Serviço indisponível.');
            res.redirect('back');            
            return; 
          }
          var token = buf.toString('hex');
          // Include on db.
          new PasswordReset({
            email: user.email,
            token: token
          })
          .save(err=>{
            if (err) { 
              log.error(err, new Error().stack);
              req.flash('error', 'Serviço indisponível.');
              res.redirect('back');            
              return; 
            }
            let mailOptions = {
                from: 'dev@zunka.com.br',
                to: req.body.email,
                subject: 'Solicitação para Redefinir senha.',
                text: 'Você recebeu este e-mail porquê você (ou alguem) requisitou a redefinição da senha de sua conta.\n\n' + 
                      'Por favor click no link, ou cole no seu navegador de internet para completar o processo.\n\n' + 
                      'https://' + req.headers.host + '/users/reset/' + token + '\n\n' +
                      // 'Esta solicitação de redefinição expira em duas horas.\n' +
                      'Se não foi você que requisitou esta redefinição de senha, por favor ignore este e-mail e sua senha permanecerá a mesma.'
            }; 
            log.info('link', 'https://' + req.headers.host + '/users/reset/' + token + '\n\n');
            // // Send email.
            // transporter.sendMail(mailOptions, function(err, info){
            //   if(err){
            //     log.error(err, new Error().stack);
            //   } else {
            //     log.info(`Reset email sent to ${req.body.email}`);
            //   }
            // });
            req.flash('success', `Foi enviado um e-mail para ${req.body.email} com instruções para a alteração da senha.`)
            res.redirect('back');
          });
        });        
      });
    }
  });
});

// Reset password page.
router.get('/reset/:token', (req, res, next)=>{
  PasswordReset.findOne({ token: req.params.token }, (err, passwordReset)=>{
    if (err) { return next(err); }
    // Found.
    if (passwordReset) {
      res.render('reset', req.flash() );
    } 
    // Not found.
    else {
      return res.render('messageLink', { message: 'Chave para alteração de senha expirou.', linkMessage: 'Deseja criar uma nova chave?', linkUrl: '/users/forgot/'});
    }
  });
});

// Reset password.
router.post('/reset/:token', (req, res, next)=>{
  // Validation.
  req.checkBody('password', 'Senha deve conter pelo menos 8 caracteres.').isLength({ min: 8});
  req.checkBody('password', 'Senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.checkBody('password', 'Senha e Confirmação da senha devem ser iguais.').equals(req.body.passwordConfirm);
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    else {
      PasswordReset.findOne({ token: req.params.token }, (err, passwordReset)=>{
        if (err) { return next(err); }     
        // Not exist token to reset password.
        if (!passwordReset) { 
          return res.render('messageLink', { message: 'Chave para alteração de senha expirou.', linkMessage: 'Deseja criar uma nova chave?', linkUrl: '/users/forgot/'});          
        }
        // Token found.
        else {
          User.findOne({ email: passwordReset.email }, (err, user)=>{
            if (err) { return next(err); }  
            // User not found.
            if (!user) {
              return res.render('messageLink', { message: 'Usuário não cadastrado.', linkMessage: 'Deseja criar um cadastro?', linkUrl: '/users/signup/'});          
            }
            // User found.
            else {
              // Update password.      
              user.password = user.encryptPassword(req.body.password);
              user.save(err=>{
                if(err) { return next(err); }
                // Remove password reset.
                passwordReset.remove(err=>{ if(err) { return next(err); } })
                req.flash('success', 'Senha alterada com sucesso.');
                res.redirect('/users/login/');              
              })                 
            }
          })
        }
      })     
    }
  });
});

// Account page.
router.get('/account', (req, res, next)=>{
  res.render('user/account', req.flash());
});

// Access page.
router.get('/access', (req, res, next)=>{
  res.render('user/access', req.flash());
});

// Orders page.
router.get('/orders', (req, res, next)=>{
  res.render('user/orders', req.flash());
});

// Edit name page.
router.get('/access/edit-name', (req, res, next)=>{
  res.render('user/editName', req.flash());
});
// Edit name.
router.post('/access/edit-name/:userId', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('name', 'Campo NOME deve ser preenchido.').notEmpty();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    // Save address.
    else {
      if (!req.params.userId) { return next(new Error('No userId to find user data.')); }
      User.findById(req.params.userId, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        user.name = req.body.name;
        user.save(function(err) {
          if (err) { return next(err); } 
          res.redirect('/users/access');
        });  
      });
    }
  });
});

// Edit email page.
router.get('/access/edit-email', (req, res, next)=>{
  res.render('user/editEmail', req.flash());
});
// Edit email.
router.post('/access/edit-email/:userId', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.checkBody('emailConfirm', 'E-mail e Confirmação do e-mail devem ser iguais.').equals(req.body.email);
  req.checkBody('password', 'Senha inválida.').notEmpty();
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    // Save address.
    else {
      if (!req.params.userId) { return next(new Error('No userId to find user data.')); }
      User.findById(req.params.userId, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        // Verify password.
        if (user.validPassword(req.body.password)) {
          user.email = req.body.email;
          user.save(function(err) {
            if (err) { return next(err); } 
            res.redirect('/users/login');
          });  
        // Inválid password.
        } else {
          req.flash('error', 'Senha incorreta');
          res.redirect('back');
        }
      });
    }
  });
});

// Edit cell phone page.
router.get('/access/edit-cell-phone', (req, res, next)=>{
  res.render('user/editCellPhone', req.flash());
});
// Edit cell phone.
router.post('/access/edit-cell-phone/:userId', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('cellphone', 'Campo NÚMERO DE TELEFONE CELULAR deve ser preenchido.').notEmpty();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    // Save address.
    else {
      if (!req.params.userId) { return next(new Error('No userId to find user data.')); }
      User.findById(req.params.userId, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        user.cellPhone = req.body.cellphone;
        user.save(function(err) {
          if (err) { return next(err); } 
          res.redirect('/users/access');
        });  
      });
    }
  });
});

// Edit password page.
router.get('/access/edit-password', (req, res, next)=>{
  res.render('user/editPassword', req.flash());
});
// Edit password.
router.post('/access/edit-password/:userId', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('password', 'Senha inválida.').notEmpty();
  req.checkBody('passwordNew', 'Nova senha deve conter pelo menos 8 caracteres.').isLength({ min: 8});
  req.checkBody('passwordNew', 'Nova senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.checkBody('passwordNewConfirm', 'Nova senha e confirmação da nova senha devem ser iguais').equals(req.body.passwordNew);  
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    // Save address.
    else {
      if (!req.params.userId) { return next(new Error('No userId to find user data.')); }
      User.findById(req.params.userId, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        // Verify password.
        if (user.validPassword(req.body.password)) {
          user.password = user.encryptPassword(req.body.passwordNew);
          user.save(function(err) {
            if (err) { return next(err); } 
            res.redirect('/users/access');
          });  
        // Inválid password.
        } else {
          req.flash('error', 'Senha incorreta');
          res.redirect('back');
        }
      });
    }
  });
});

// Edit CPF page.
router.get('/access/edit-cpf', (req, res, next)=>{
  res.render('user/editCpf', req.flash());
});
// Edit CPF.
router.post('/access/edit-cpf/:userId', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('cpf', 'Campo CPF deve ser preenchido.').notEmpty();
  req.checkBody('cpf', 'CPF inválido.').isCpf();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    // Save address.
    else {
      if (!req.params.userId) { return next(new Error('No userId to find user data.')); }
      User.findById(req.params.userId, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        user.cpf = req.body.cpf;
        user.save(function(err) {
          if (err) { return next(err); } 
          res.redirect('/users/access');
        });  
      });
    }
  });
});

// Delete account page.
router.get('/access/delete-account', (req, res, next)=>{
  res.render('user/deleteAccount', req.flash());
});
// Delete account.
router.post('/access/delete-account/:userId', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.checkBody('password', 'Senha inválida.').notEmpty();
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    // Save address.
    else {
      if (!req.params.userId) { return next(new Error('No userId to find user data.')); }
      User.findById(req.params.userId, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        // Verify e-mail.
        if (user.email !== req.body.email) { 
          req.flash('error', 'E-mail incorreto');
          res.redirect('back');
          return;
        }
        // Verify password.
        if (user.validPassword(req.body.password)) {
          let removedUser = new RemovedUser();
          removedUser.name = user.name;
          removedUser.email = user.email;
          removedUser.cpf = user.cpf;
          removedUser.cellPhone = user.cellPhone;
          removedUser.password = user.password;
          removedUser.group = user.group;
          removedUser.status = user.status;
          removedUser.createdAt = user.createdAt;
          removedUser.modifiedAt = user.modifiedAt;
          // Save user removed for security reasons.
          removedUser.save(function(err) {
            if (err) { return next(err); } 
            req.logout();
            // Remove user.
            user.remove(err=>{
              if (err) { return next(err); }
              // Remove cart.
              redis.del(`cart:${user.email}`); 
              req.flash('success', 'Conta apagada com sucesso.');
              res.redirect('/users/login/');               
            });
          });  
        // Inválid password.
        } else {
          req.flash('error', 'Senha incorreta');
          res.redirect('back');
        }
      });
    }
  });
});

// Address page.
router.get('/address', (req, res, next)=>{
  Address.find({ user_id: req.user._id }, (err, addresss)=>{
    if (err) return next(err);
    let data = req.flash();
    data.addresss = addresss;
    res.render('user/address', data); 
  })
});

// Add address page.
router.get('/address/add', (req, res, next)=>{
  res.render('user/addressAdd', req.flash());
});
// Add address.
router.post('/address/add', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('name', 'Campo NOME deve ser preenchido.').notEmpty();
  req.checkBody('cep', 'Campo CEP deve ser preenchido.').notEmpty();
  req.checkBody('address', 'Campo ENDEREÇO deve ser preenchido.').notEmpty();
  req.checkBody('addressNumber', 'Campo NÚMERO deve ser preenchido.').notEmpty();
  req.checkBody('district', 'Campo BAIRRO deve ser preenchido.').notEmpty();
  req.checkBody('city', 'Campo CIDADE deve ser preenchido.').notEmpty();
  req.checkBody('state', 'Campo ESTADO deve ser preenchido.').notEmpty();
  req.checkBody('phone', 'Campo TELEFONE deve ser preenchido.').notEmpty();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    // Save address.
    else {
      let address = new Address();
      address.user_id = req.user._id;
      address.name = req.body.name;
      address.cep = req.body.cep;
      address.address = req.body.address;
      address.addressNumber = req.body.addressNumber;
      address.addressComplement = req.body.addressComplement;
      address.district = req.body.district;
      address.city = req.body.city;
      address.state = req.body.state;
      address.phone = req.body.phone;
      address.save(function(err) {
        if (err) { return next(err); } 
        res.redirect('/users/address');
      });        
    }
  });
});

// Edit address page.
router.get('/address/edit', (req, res, next)=>{
  Address.findById(req.query.addressId, (err, address)=>{
    if (err) return next(err);
    let data = req.flash();
    data.address = address;
    res.render('user/addressEdit', data);
  });
});

// Edit address.
router.post('/address/edit', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('name', 'Campo NOME deve ser preenchido.').notEmpty();
  req.checkBody('cep', 'Campo CEP deve ser preenchido.').notEmpty();
  req.checkBody('address', 'Campo ENDEREÇO deve ser preenchido.').notEmpty();
  req.checkBody('addressNumber', 'Campo NÚMERO deve ser preenchido.').notEmpty();
  req.checkBody('district', 'Campo BAIRRO deve ser preenchido.').notEmpty();
  req.checkBody('city', 'Campo CIDADE deve ser preenchido.').notEmpty();
  req.checkBody('state', 'Campo ESTADO deve ser preenchido.').notEmpty();
  req.checkBody('phone', 'Campo TELEFONE deve ser preenchido.').notEmpty();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      req.flash('error', messages);
      res.redirect('back');
      return;
    } 
    // Save address.
    else {
      if (!req.body.addressId) { return next(new Error('No addressId to find address data.')); }
      Address.findById(req.body.addressId, (err, address)=>{
        if (err) { return next(err) };
        if (!address) { return next(new Error('Not found address to save.')); }
        address.user_id = req.user._id;
        address.name = req.body.name;
        address.cep = req.body.cep;
        address.address = req.body.address;
        address.addressNumber = req.body.addressNumber;
        address.addressComplement = req.body.addressComplement;
        address.district = req.body.district;
        address.city = req.body.city;
        address.state = req.body.state;
        address.phone = req.body.phone;
        address.save(function(err) {
          if (err) { return next(err); } 
          res.redirect('/users/address');
        });  
      });
    }
  });
});

// Set address as default.
router.put('/address/default/:addressId', checkPermission, (req, res, next)=>{
  Address.findById(req.params.addressId, function(err, address){
    if (err) { next(err) };
    if (address) {
      // Set all not default.
      Address.where({ user_id: address.user_id }).updateMany({ default: false }, err=>{
        if (err) { next(err) };
        // Set default.
        address.default = true;
        address.save(err=>{
          if (err) { next(err) };
          res.json({success: true, msg: 'Address default changed.' });  
        });
      });    
    }
  })
});

// Remove user address.
router.put('/address/remove/:addressId', checkPermission, (req, res, next)=>{
  Address.remove({ _id: req.params.addressId}, (err)=>{
    if (err) { next(err) };
    res.json({success: true, msg: 'Address removed.' });  
  });
});

// // Login page (no bootstrap).
// router.get('/loginc', (req, res, next)=>{
//   // Message from authentication, who set a flash message with erros.
//   res.render('loginC', { message: req.flash('error') });
// });


/****************************************************************************** 
/   ORDERS
******************************************************************************/

// Get orders page.
router.get('/', checkPermission, function(req, res, next) {
  res.render('user/orderList', {
    page: req.query.page ? req.query.page : 1,
    search: req.query.search ? req.query.search : '',  
    nav: {
      showAdminLinks: true
    }
  });   
});

// Get orders.
router.get('/api/orders/:user_id', checkPermission, function(req, res, next) {
  const user_id = req.params.user_id;
  const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
  const skip = (page - 1) * PRODUCT_QTD_BY_PAGE;
  const search = req.query.search
    ? { user_id: user_id, isClosed: {$exists: true}, _id: {$regex: req.query.search, $options: 'i'} }
    : { user_id: user_id, isClosed: {$exists: true} };
  // Find orders.
  let orderPromise = Order.find(search).sort({'isClosed': 1}).skip(skip).limit(ORDER_QTD_BY_PAGE).exec();
  // Order count.
  let orderCountPromise = Order.find({ user_id: user_id, isClosed: {$exists: true} }).count(search).exec();
  Promise.all([orderPromise, orderCountPromise])
  .then(([orders, count])=>{    
    res.json({orders, page, pageCount: Math.ceil(count / ORDER_QTD_BY_PAGE)});
  }).catch(err=>{
    return next(err);
  });
});


/****************************************************************************** 
/   PERMISSIONS
******************************************************************************/

// Check permission.
function checkPermission (req, res, next) {
  // Should be admin.
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/users/login');
}

// Check not logged.
function checkNotLogged (req, res, next) {
  // Should be admin.
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

module.exports = router;
