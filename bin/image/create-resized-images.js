#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ZUNKAPATH must be defined.
if (!process.env.ZUNKA_SITE_PATH) {
    console.error(`ZUNKA_SITE_PATH not defined.`);
    process.exit(1);
} 

const IMG_PATH = path.join(process.env.ZUNKA_SITE_PATH, 'dist/img');
// console.log(`PATH: ${IMG_PATH}`);

// Get all image dirs.
fs.readdir(IMG_PATH, {withFileTypes: true}, (err, imgDirs)=>{
  imgDirs.forEach((imgDir)=>{
    if (imgDir.isDirectory()) {
      let imgDirPath = path.join(IMG_PATH, imgDir.name);
      // console.log(imgDirPath);
      // Get all image files.
      fs.readdir(imgDirPath, {withFileTypes: true}, (err, imgs)=>{
        imgs.forEach((img)=>{
          if (img.isFile()) {
            let imgPath = path.join(imgDirPath, img.name)
            // console.log(imgPath);
            // var ext = /\.[0-9a-z]{1,5}$/i;
            var ext = /_[0-9a-z]{1,6}\.[0-9a-z]+$/i;
            // Not resize resized images.
            if (!imgPath.match(ext)) {
              // console.log(imgPath);
              let pathObj = path.parse(imgPath);
              // File output.
              let fileOut = {
                _0080: path.format({dir: pathObj.dir, name: pathObj.name + '_0080px', ext: pathObj.ext }), 
                _0500: path.format({dir: pathObj.dir, name: pathObj.name + '_0500px', ext: pathObj.ext }) 
              }
              // 0080 pixels.
              sharp(imgPath)
                .resize(80)
                .toFile(fileOut._0080, (err, info)=>{
                  if (err) {
                    console.error(err);
                  }
                  console.debug('Creted file: ', fileOut._0080);
                });
              // 0500 pixels.
              sharp(imgPath)
                .resize(500)
                .toFile(fileOut._0500, (err, info)=>{
                  if (err) {
                    console.error(err);
                  }
                  console.debug('Creted file: ', fileOut._0500);
                });
            }
          }
        })
      })
    }
  })
})
