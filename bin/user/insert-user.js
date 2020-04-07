#!/usr/bin/node
'use strict';
const mongoose = require('../db/mongoose');
const User = require('../model/user');

let carlos = new User({
  name: 'Carlos',
  password: 'asdf',
  email: 'carlos@gmail.com',
});

carlos.save(function(err, carlos){
  if (err) {
    console.error(err);
  }
  console.log(carlos.name);
  mongoose.close();
})