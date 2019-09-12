'use strict';
const express = require('express');
const redis = require('../db/redis');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const emailSender = require('../config/email');
// Personal modules.
const log = require('../config/log');
const User = require('../model/user');
const RemovedUser = require('../model/removedUser');
const EmailConfirmation = require('../model/emailConfirmation');
const PasswordReset = require('../model/passwordReset');
const Address = require('../model/address');
const Order = require('../model/order');

// Quantity of orders per page.
const ORDER_QTD_BY_PAGE = 20;


/****************************************************************************** 
/   SIGNUP
******************************************************************************/

// Signup page.
router.get('/signup', checkNotLogged, (req, res, next)=>{
  res.render('user/signup', { nav: {} } );
});

// Signup request.
router.post('/api/signup', checkNotLogged, (req, res, next)=>{
  // Validation.
  req.checkBody('name', 'Nome deve conter pelo menos 2 caracteres.').isLength({ min: 2});
  req.checkBody('name', 'Nome deve conter no máximo 40 caracteres.').isLength({ max: 40});
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.checkBody('password', 'Senha deve conter pelo menos 8 caracteres.').isLength({ min: 8});
  req.checkBody('password', 'Senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.checkBody('password', 'Senha e confirmação da senha devem ser iguais').equals(req.body.passwordConfirm);
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    // Send validation errors.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return res.json({ success: false, message: messages[0] });
    } 
    // No validation erros.
    else {
      passport.authenticate('local.signup', (err, user, info)=>{
        if (err) { 
          res.json({ success: false, message: 'Erro interno.'});
          return next(err); 
        }
        // Not signin.
        if (!user) { 
          return res.json({ success: false, message: info.message});
        }
        // First step of signup, successful.
        return res.json({success: true, message: info.message});
      })(req, res, next);
    }
  });
});

// Confirm signup.
router.get('/signin/:token', (req, res, next)=>{
  EmailConfirmation.findOne({ token: req.params.token }, (err, emailConfirmation)=>{
    // Internal error.
    if (err) { 
      log.error(err.stack);
      return res.render('user/signin', { nav: {}, warnMessage: 'Serviço indisponível.' ,successMessage: ''});
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
          log.error(err.stack);
          return res.render('user/signin', { nav: {}, warnMessage: 'Não foi possível confirmar sua conta. Favor entrar em contato com o suporte técnico.', successMessage: '' });
        }
        emailConfirmation.remove(err=>{ if (err) { log.error(err.stack); } });
        return res.render('user/signin', { 
          nav: {}, warnMessage: '', 
          successMessage: `Oi, ${newUser.name}.\nSua conta foi confirmada.\nBoas Compras.` 
        });
      });  
    } 
    // No email confirmation.
    else {
      return res.render('user/signin', { nav: {}, warnMessage: 'A conta já foi confirmada ou link para a confirmação expirou.', successMessage: '' });
    }  
  })     
});

// Login page.
router.get('/signin', checkNotLogged, (req, res, next)=>{
  res.render('user/signin', { nav: {}, warnMessage: '', successMessage: ''});
});

// Login request.
router.post('/api/signin', checkNotLogged, (req, res, next)=>{
  // Validation.
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.checkBody('password', 'Senha deve conter pelo menos 8 caracteres.').isLength({ min: 8});
  req.checkBody('password', 'Senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    // Send validation errors.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return res.json({ success: false, message: messages[0]});
    }
    // No validation erros.
    else {
      passport.authenticate('local.signin', (err, user, info)=>{
        if (err) { return next(err); }
        // Not signin.
        if (!user) { 
          return res.json({ message: info.message});
        }
        // Signin.
        req.login(user, function(err){
          if(err) { return next(err); }
          // To redirect to cart.
          if (req.flash('redirect-signin-complete') == 'cart') {
            return res.json({success: true, redirect: '/cart'});
          }
          // Redirect to main page.
          else {
            return res.json({success: true, redirect: '/'});
          }
        })
      })(req, res, next);
    }
  }); 
});

// signout.
router.get('/signout', (req, res, next)=>{
  if (req.isAuthenticated()) {
    req.logout();
    res.redirect('/user/signin');
  } else {
    res.redirect('/user/signin');
  }
});

// Forgot password page.
router.get('/forgottenPassword', checkNotLogged, (req, res, next)=>{
  res.render('user/forgottenPassword', { nav: {}, warnMessage: '', successMessage: ''});
});

// Forgot password.
router.post('/api/forgottenPassword', (req, res, next)=>{
  // Validation.
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      // log.debug(JSON.stringify(messages));
      return res.json({ success: false, message: messages[0]});
    } 
    else {
      // log.debug('before-findone');
      User.findOne({ email: req.body.email }, (err, user)=>{
        // No exist.
        if(!user){
          return res.json({ success: false, message: `O email ${req.body.email} não consta em nosso sistema.`});
        }        
        // Create token.
        crypto.randomBytes(20, function(err, buf) {
          if (err) { 
            log.error(err.stack);
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
              log.error(err.stack);
              req.flash('error', 'Serviço indisponível.');
              res.redirect('back');            
              return; 
            }
            let mailOptions = {
                from: '',
                to: req.body.email,
                subject: 'Solicitação para Redefinir senha.',
                text: 'Você recebeu este e-mail porquê você (ou alguem) requisitou a redefinição da senha de sua conta.\n\n' + 
                      'Por favor clique no link, ou cole-o no seu navegador de internet para completar o processo.\n\n' + 
                      'https://' + req.app.get('hostname') + '/user/reset-password/' + token + '\n\n' +
                      // 'Esta solicitação de redefinição expira em duas horas.\n' +
                      'Se não foi você que requisitou esta redefinição de senha, por favor, ignore este e-mail e sua senha permanecerá a mesma.'
            }; 
            emailSender.sendMail(mailOptions, err=>{
              if(err){
                log.error(err.stack);
                return res.json({ success: false, message: 'Erro interno.'});
              } else {
                log.info(`Password reset email sent to ${req.body.email}`);
                return res.json({ success: true, message: `Foi enviado um e-mail para ${req.body.email} com instruções para a alteração da senha.`});
              }
            })
          });
        });        
      });
    }
  }).catch(err=>{
    return next(err);
  });
});

// Reset password page.
router.get('/reset-password/:token', (req, res, next)=>{
  PasswordReset.findOne({ token: req.params.token }, (err, passwordReset)=>{
    if (err) { return next(err); }
    // Found.
    if (passwordReset) {
      res.render('user/resetPassword', { nav: {} , resetPasswordToken: req.params.token} );
    } 
    // Not found.
    else {
      return res.render('user/messageLink', { nav: {}, message: 'Chave para alteração de senha expirou.', linkMessage: 'Deseja criar uma nova chave?', linkUrl: '/user/forgot/'});
    }
  });
});

// Reset password.
router.post('/reset-password/:token', (req, res, next)=>{
  // Validation.
  req.checkBody('password', 'Senha deve conter pelo menos 8 caracteres.').isLength({ min: 8});
  req.checkBody('password', 'Senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.checkBody('password', 'Senha e Confirmação da senha devem ser iguais.').equals(req.body.passwordConfirm);
  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return res.json({ success: false, message: messages[0] });
    } 
    else {
      PasswordReset.findOne({ token: req.params.token }, (err, passwordReset)=>{
        if (err) { return next(err); }     
        // Not exist token to reset password.
        if (!passwordReset) { 
          return res.json({ success: false, message: 'Chave para alteração de senha expirou.' });
        }
        // Token found.
        else {
          User.findOne({ email: passwordReset.email }, (err, user)=>{
            if (err) { return next(err); }  
            // User not found.
            if (!user) {
              return res.json({ success: false, message: 'Usuário não cadastrado.' });
            }
            // User found.
            else {
              // Update password.      
              user.password = user.encryptPassword(req.body.password);
              user.save(err=>{
                if(err) { return next(err); }
                // Remove password reset.
                passwordReset.remove(err=>{ if(err) { return next(err); } })
                return res.json({ success: true });              
              })                 
            }
          })
        }
      })     
    }
  });
});


/****************************************************************************** 
/   ACCESS
******************************************************************************/

// Account page.
router.get('/account', checkPermission, (req, res, next)=>{
  res.render('user/account', { nav: {} } );
});

// Access page.
router.get('/access', checkPermission, (req, res, next)=>{
  res.render('user/access', { nav: {}, user: req.user });
});

// Edit name page.
router.get('/access/edit-name', checkPermission, (req, res, next)=>{
  res.render('user/editName', { nav: {}, name: req.user.name });
});
// Edit name.
router.post('/access/edit-name', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('name', 'Campo NOME deve ser preenchido.').notEmpty();
  req.checkBody('name', 'Nome deve conter pelo menos 2 caracteres.').isLength({ min: 2});
  req.checkBody('name', 'Nome deve conter no máximo 40 caracteres.').isLength({ max: 40});
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return res.json({ success: false, message: messages[0]});
    } 
    else {
      User.findById(req.user._id, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        user.name = req.body.name;
        user.save(function(err) {
          if (err) { return next(err); } 
          return res.json({ success: true });
        });  
      });
    }
  });
});

// Edit email page.
router.get('/access/edit-email', checkPermission, (req, res, next)=>{
  res.render('user/editEmail', { nav: {}, email: req.user.email });
});
// Edit email.
router.post('/access/edit-email', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('newEmail', 'E-mail inválido.').isEmail();
  req.checkBody('newEmailConfirm', 'E-mail e Confirmação do e-mail devem ser iguais.').equals(req.body.newEmail);
  req.checkBody('password', 'Senha inválida.').notEmpty();
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return res.json({ success: false, message: messages[0]});
    } 
    // Save address.
    else {
      User.findById(req.user._id, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        // Verify password.
        if (user.validPassword(req.body.password)) {
          user.email = req.body.newEmail;
          user.save(function(err) {
            if (err) { return next(err); } 
            return res.json({ success: true });
          });  
        // Inválid password.
        } else {
          req.flash('error', 'Senha incorreta');
          return res.json({ success: false, message: 'Senha incorreta'});
        }
      });
    }
  });
});

// Edit cell phone page.
router.get('/access/edit-mobile-number', checkPermission,(req, res, next)=>{
  res.render('user/editMobileNumber', { nav: {}, mobileNumber: req.user.mobileNumber});
});

// Edit cell phone.
router.post('/access/edit-mobile-number', checkPermission, (req, res, next)=>{
  // Validation.
  // req.checkBody('mobileNumber', 'Campo NÚMERO DE CELULAR deve ser preenchido.').notEmpty();
  let mobileNumberTemp = req.body.mobileNumber.match(/\d+/g);
  if (mobileNumberTemp != null) {
    req.body.mobileNumber = mobileNumberTemp.join('');
  } 
  if (req.body.mobileNumber != "") {
    req.checkBody('mobileNumber', 'Campo NÚMERO DE CELULAR ínválido.').isLength({ min: 10});
    req.checkBody('mobileNumber', 'Campo NÚMERO DE CELULAR inválido.').isLength({ max: 11});
  }
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return res.json({ success: false, message: messages[0]});
    } 
    // Save address.
    else {
      if (req.body.mobileNumber != "") {
        // Array [2][1][1+][4].
        mobileNumberTemp = req.body.mobileNumber.match(/(^\d{2})(\d)(\d+)(\d{4})$/);
        // Format to 000.000.000-00.
        mobileNumberTemp = `(${mobileNumberTemp[1]}) ${mobileNumberTemp[2]} ${mobileNumberTemp[3]}-${mobileNumberTemp[4]}`;
      } else{
        mobileNumberTemp = "";
      }
      User.findById(req.user._id, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        user.mobileNumber = mobileNumberTemp;
        user.save(function(err) {
          if (err) { return next(err); } 
          return res.json({ success: true });
        });  
      });
    }
  });
});

// Edit password page.
router.get('/access/edit-password', checkPermission, (req, res, next)=>{
  res.render('user/editPassword', { nav: {} });
});

// Edit password.
router.post('/access/edit-password', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('newPassword', 'Nova senha deve conter pelo menos 8 caracteres.').isLength({ min: 8});
  req.checkBody('newPassword', 'Nova senha deve conter no máximo 20 caracteres.').isLength({ max: 20});
  req.checkBody('newPasswordConfirm', 'Nova senha e confirmação da nova senha devem ser iguais').equals(req.body.newPassword);  
  req.checkBody('oldPassword', 'Senha inválida.').notEmpty();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return res.json({ success: false, message: messages[0]});
    } 
    // Save address.
    else {
      User.findById(req.user._id, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        // Verify password.
        if (user.validPassword(req.body.oldPassword)) {
          user.password = user.encryptPassword(req.body.newPassword);
          user.save(function(err) {
            if (err) { return next(err); } 
            return res.json({ success: true });
          });  
        // Inválid password.
        } else {
          return res.json({ success: false, message: 'Senha incorreta.' });
        }
      });
    }
  });
});

// Edit CPF page.
router.get('/access/edit-cpf', checkPermission, (req, res, next)=>{
  res.render('user/editCpf', { nav: {}, cpf: req.user.cpf });
});

// Edit CPF.
router.post('/access/edit-cpf', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('cpf', 'Campo CPF deve ser preenchido.').notEmpty();
  req.checkBody('cpf', 'CPF inválido.').isCpf();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return res.json({ success: false, message: messages[0]});
    } 
    // Save address.
    else {
      // Get only the digits.
      let cpf = req.body.cpf.match(/\d+/g).join('');
      // Array [3][3][3][2].
      cpf = cpf.match(/\d{2}\d?/g); 
      // Format to 000.000.000-00.
      cpf = `${cpf[0]}.${cpf[1]}.${cpf[2]}-${cpf[3]}`
      User.findById(req.user._id, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        user.cpf = cpf;
        user.save(function(err) {
          if (err) { return next(err); } 
          return res.json({ success: true });
        });  
      });
    }
  });
});

// Delete account page.
router.get('/access/delete-account', checkPermission, (req, res, next)=>{
  res.render('user/deleteAccount', { nav: {} } );
});

// Delete account.
router.post('/access/delete-account', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('email', 'E-mail inválido.').isEmail();
  req.checkBody('password', 'Senha inválida.').notEmpty();
  req.sanitizeBody("email").normalizeEmail();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return res.json({ success: false, message: messages[0]});
    } 
    // Save address.
    else {
      User.findById(req.user._id, (err, user)=>{
        if (err) { return next(err) };
        if (!user) { return next(new Error('Not found user to save.')); }
        // Verify e-mail.
        if (user.email !== req.body.email) { 
          return res.json({ success: false, message: 'E-mail incorreto'})
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
          // Save user removed for security reasons.
          removedUser.save(function(err) {
            if (err) { return next(err); } 
            req.logout();
            // Remove user.
            user.remove(err=>{
              if (err) { return next(err); }
              // Remove cart.
              redis.del(`cart:${user.email}`); 
              log.info(`Account ${removedUser.email} was removed.`);
              return res.json({ success: true })            
            });
          });  
        // Inválid password.
        } else {
          return res.json({ success: false, message: 'Senha incorreta.'})
        }
      });
    }
  });
});

// Account deleted.
router.get('/access/account-deleted', (req, res, next)=>{
  res.render('user/accountDeleted', { nav: {} } );
});

// Address page.
router.get('/address', checkPermission, (req, res, next)=>{
  Address.find({ user_id: req.user._id }, (err, addresses)=>{
    if (err) return next(err);
    res.render('user/address', { nav: {}, addresses: addresses }); 
  })
});

// Edit address page.
router.get('/address/edit', checkPermission, (req, res, next)=>{
  if (req.query.addressId === 'new') {
    let address = new Address();
    res.render('user/editAddress', { nav: {}, isNewAddress: true, address: address });
  } else  {
    Address.findById(req.query.addressId, (err, address)=>{
      if (err) return next(err);
      res.render('user/editAddress', { nav: {}, isNewAddress: false, address: address } );
    });
  }
});

// Edit address.
router.post('/address/edit', checkPermission, (req, res, next)=>{
  // Validation.
  req.checkBody('address.name', 'Campo NOME deve ser preenchido.').notEmpty();
  req.checkBody('address.cep', 'Campo CEP deve ser preenchido.').notEmpty();
  req.checkBody('address.cep', 'CEP inválido.').isCep();
  req.checkBody('address.address', 'Campo ENDEREÇO deve ser preenchido.').notEmpty();
  req.checkBody('address.addressNumber', 'Campo NÚMERO deve ser preenchido.').notEmpty();
  req.checkBody('address.district', 'Campo BAIRRO deve ser preenchido.').notEmpty();
  req.checkBody('address.city', 'Campo CIDADE deve ser preenchido.').notEmpty();
  req.checkBody('address.state', 'Campo ESTADO deve ser preenchido.').notEmpty();
  req.checkBody('address.phone', 'Campo TELEFONE deve ser preenchido.').notEmpty();
  req.getValidationResult().then(function(result) {
    // Send validations errors to client.
    if (!result.isEmpty()) {
      let messages = [];
      messages.push(result.array()[0].msg);
      return res.json({ success: false, message: messages[0]});
    } 
    // Save address new address.
    else if (req.query.addressId === 'new'){
      let address = new Address();
      address.user_id = req.user._id;
      address.name = req.body.address.name;
      address.cep = req.body.address.cep;
      address.address = req.body.address.address;
      address.addressNumber = req.body.address.addressNumber;
      address.addressComplement = req.body.address.addressComplement;
      address.district = req.body.address.district;
      address.city = req.body.address.city;
      address.state = req.body.address.state;
      address.phone = req.body.address.phone;
      address.save(function(err) {
        if (err) { return next(err); } 
        return res.json({ success: true });
      });        
    }
    // save specific address.
    else if (req.query.addressId) {
      Address.findByIdAndUpdate(req.query.addressId, { 
        $set: { 
          name: req.body.address.name,
          cep: req.body.address.cep,
          address: req.body.address.address,
          addressNumber: req.body.address.addressNumber,
          addressComplement: req.body.address.addressComplement,
          district: req.body.address.district,
          city: req.body.address.city,
          state: req.body.address.state,
          phone: req.body.address.phone
        }}, err=>{
          if (err) return next(err);
          return res.json({ success: true });
      });
    }
    // Not new no edit addres.
    else{
      return res.json({ success: false, message: 'Erro interno do sistema.' });
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
          res.json({success: true});  
        });
      });    
    }
  })
});

// Remove user address.
router.put('/address/remove/:addressId', checkPermission, (req, res, next)=>{
  Address.deleteOne({ _id: req.params.addressId}, (err)=>{
    if (err) { next(err) };
    res.json({success: true, msg: 'Address removed.' });  
  });
});



/****************************************************************************** 
/   ORDERS
******************************************************************************/

// Get orders page.
router.get('/orders', checkPermission, function(req, res, next) {
  res.render('user/orderList', { nav: {} } );
});

// Get orders data.
router.get('/api/orders', checkPermission, function(req, res, next) {
  const user_id = req.params.user_id;
  const page = (req.query.page && (req.query.page > 0)) ? req.query.page : 1;
  const skip = (page - 1) * ORDER_QTD_BY_PAGE;
  // Db search.
  let search;
  // No search request.
  if (req.query.search == '') {
    search = { user_id: req.user._id, 'timestamps.placedAt': {$exists: true} };
  } 
  // Search by _id.
  else if (req.query.search.match(/^[a-f\d]{24}$/i)) {
    search = { user_id: req.user._id, 'timestamps.placedAt': {$exists: true}, _id: req.query.search };
  }
  // No search by _id.
  else {
    search = { 
      user_id: req.user._id, 'timestamps.placedAt': {$exists: true},
      $or: [ 
        {'shipping.address.name': {$regex: req.query.search, $options: 'i'}},
        {totalPrice: {$regex: req.query.search, $options: 'i'}},
        {'items.name': {$regex: req.query.search, $options: 'i'}},
      ] 
    }
  }
  // Find orders.
  let orderPromise = Order.find(search).sort({'timestamps.placedAt': -1}).skip(skip).limit(ORDER_QTD_BY_PAGE).exec();
  // Order count.
  let orderCountPromise = Order.find(search).countDocuments().exec();
  Promise.all([orderPromise, orderCountPromise])
  .then(([orders, count])=>{    
    res.json({orders, page, pageCount: Math.ceil(count / ORDER_QTD_BY_PAGE)});
  }).catch(err=>{
    return next(err);
  });
});


/****************************************************************************** 
/   TEST
******************************************************************************/

// Message link - just for test.
router.get('/message-link', (req, res, next)=>{
  return res.render('user/messageLink', { nav: {}, message: 'Este é apenas um teste.', linkMessage: 'Deseja ir para a página principal?', linkUrl: '/'});
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
  res.redirect('/user/signin');
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
