#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG_PATH = path.join(__dirname, '../dist/img');
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
                _0200: path.format({dir: pathObj.dir, name: pathObj.name + '_0200px', ext: pathObj.ext }), 
                _0300: path.format({dir: pathObj.dir, name: pathObj.name + '_0300px', ext: pathObj.ext }) 
              }
              // console.log(fileOut._0080);
              // 0080 pixels.
              sharp(imgPath)
                .resize(80)
                .toFile(fileOut._0080, (err, info)=>{
                  if (err) {
                    console.error(err);
                  }
                  console.debug('Creted file: ', fileOut._0080);
                });
              // 0200 pixels.
              sharp(imgPath)
                .resize(200)
                .toFile(fileOut._0200, (err, info)=>{
                  if (err) {
                    console.error(err);
                  }
                  console.debug('Creted file: ', fileOut._0200);
                });
              // 0300 pixels.
              sharp(imgPath)
                .resize(300)
                .toFile(fileOut._0300, (err, info)=>{
                  if (err) {
                    console.error(err);
                  }
                  console.debug('Creted file: ', fileOut._0300);
                });
            }
          }
        })
      })
    }
  })
})


// sharp('../dist/img/5bb77fb064660516779500e4/upload_038bf8c97212c141b73686c20d4cd462.jpg')
//   .resize(300)
//   .toFile('../dist/img/5bb77fb064660516779500e4/upload_038bf8c97212c141b73686c20d4cd462_300.jpg', (err, info)=>{
//     if (err) {
//       console.error(err);
//     }
//     console.debug(info);
//   });

// sharp('../dist/img/5bb77fb064660516779500e4/upload_038bf8c97212c141b73686c20d4cd462.jpg')
//   .resize(200)
//   .toFile('../dist/img/5bb77fb064660516779500e4/upload_038bf8c97212c141b73686c20d4cd462_200.jpg', (err, info)=>{
//     if (err) {
//       console.error(err);
//     }
//     console.debug(info);
//   });

// sharp('../dist/img/5bb77fb064660516779500e4/upload_038bf8c97212c141b73686c20d4cd462.jpg')
//   .resize(80)
//   .toFile('../dist/img/5bb77fb064660516779500e4/upload_038bf8c97212c141b73686c20d4cd462_80.jpg', (err, info)=>{
//     if (err) {
//       console.error(err);
//     }
//     console.debug(info);
//   });
