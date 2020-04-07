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
            var ext = /_[0-9a-z]{4}px\.[0-9a-z]+$/i;
            if (imgPath.match(ext)) {
              // // Remvove old resize.
              // console.log(imgPath, 'to delete.');
              // Uncoment to delete file.
              fs.unlink(imgPath, (err)=>{
                if(err) { 
                  console.error(err); 
                } else {
                  console.debug(imgPath, 'deleted.')
                }
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
