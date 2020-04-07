#!/usr/bin/env node
'use strict';
const fs = require('fs');
const request = require('request');

const download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    if (err) {
      console.log(`error: ${err}`);
    }
    // console.log('content-type:', res.headers['content-type']);
    // console.log('content-length:', res.headers['content-length']);
    if (res.headers['content-length'] === '2163') {
      callback('image not loaded, content-length: 2163, probably not a product image');
    } else {
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    }
  });
};
module.exports = download;

// download(
//   'http://images.allnations.com.br/imagens/produtos/imagemSite.aspx?h=196&l=246&src=0041767-01',
//   'temp/temp.jpeg',
//   function(){
//     console.log('done');
//   }
// );
