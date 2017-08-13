#!/usr/bin/node
'use strict';
const mongoose = require('../db/mongoose');
const User = require('../model/user');

// User.find({ name: 'Carloss'}, function(err, user){
//   if (err) { 
//     console.error(err);
//   }
//   console.log('user: ', JSON.stringify(user));
//   mongoose.close();
// })

// User.findOne({ email: 'douglasmg7@gmail.com'}, function(err, user){
//   if (err) { 
//     console.error(err);
//   }
//   console.log('user: ', JSON.stringify(user));
//   mongoose.close();
// })

User.findOne({ email: 'douglasmg7@gmail.com'}, function(err, user){
  if (err) { 
    console.error(err);
  }
  console.log('user: ', JSON.stringify(user));
  user.name = 'asdf'
  user.save(err=>{
    if (err) {
      console.error(err);
    }
    console.log('saved')
    mongoose.close();
  })
})