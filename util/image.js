'use strict';

const log = require('../config/log');
const fs = require('fs')  
const path = require('path')  
const axios = require('axios');
// Resize images.
const sharp = require('sharp');
const Product = require('../model/product');

// Download ao images product, create resized images and save product image list.
function downloadImagesAndUpdateProduct(imagesLink, product) {
    try {
        const pathOut = path.resolve(process.env.ZUNKA_SITE_PATH, 'dist/img', product._id.toString());
        if (!fs.existsSync(pathOut)){
            fs.mkdirSync(pathOut);
        }
        let promises = [];
        imagesLink.forEach(imgLink=>{
            log.debug(`Product _id ${product._id}`);
            log.debug(`Downloading image ${imgLink}`);
            log.debug(`Saving image to ${pathOut}`);
            promises.push(new Promise((resolve, reject)=>{
                axios.get(imgLink, { responseType: 'stream' })
                .then(response=>{
                    const fileOut = path.resolve(pathOut , path.basename(imgLink))
                    const writer = fs.createWriteStream(fileOut)
                    writer.on('finish', ()=>{
                        log.debug(`Image for product ${product._id} was downloaded to ${fileOut}`);
                        resolve(fileOut)
                    });
                    writer.on('error', err=>{ reject(err); });
                    response.data.pipe(writer)
                })
                .catch(err=>{
                    reject(err);
                });
            }))
        });
        Promise.all(promises)
        .then(filesOut=>{
            // Create resized images.
            createResizedImgs(filesOut);
            // Save product image list.
            filesOut.forEach(fileOut=>{
                product.images.push(path.basename(fileOut));
            });
            product.save(err=>{
                if (err) {
                    log.error(`Saving product ${product._id} after downloading images.  ${err.stack}`);
                }

            })
        })
        .catch(err=>{
            log.error(`Downloading image ${imagesLink} from product ${product._id}. ${err.stack}`);
        });
    } catch(err) {
        log.error(`Downloading product images (catch err). ${err.stack}`);
    }
};

// Create resized images.
function createResizedImgs(images){
	images.forEach(imgPath=>{
		var ext = /_[0-9a-z]{1,6}\.[0-9a-z]+$/i;
		let pathObj = path.parse(imgPath);
		// File output.
		let fileOut = {
			_0080: path.format({dir: pathObj.dir, name: pathObj.name + '_0080px', ext: pathObj.ext }),
			_0200: path.format({dir: pathObj.dir, name: pathObj.name + '_0200px', ext: pathObj.ext }),
			_0300: path.format({dir: pathObj.dir, name: pathObj.name + '_0300px', ext: pathObj.ext })
		}
		// 0080 pixels.
		sharp(imgPath)
			.resize(80)
			.toFile(fileOut._0080, (err, info)=>{
				if (err) {
					log.error(err);
				}
				log.debug('Resized image was created: ' + fileOut._0080);
			});
		// 0200 pixels.
		sharp(imgPath)
			.resize(200)
			.toFile(fileOut._0200, (err, info)=>{
				if (err) {
					log.error(err);
				}
				log.debug('Resized image was created: ' + fileOut._0200);
			});
		// 0300 pixels.
		sharp(imgPath)
			.resize(300)
			.toFile(fileOut._0300, (err, info)=>{
				if (err) {
					log.error(err);
				}
				log.debug('Resized image was created: ' + fileOut._0300);
			});
	})
}

module.exports.createResizedImgs = createResizedImgs;
module.exports.downloadImagesAndUpdateProduct = downloadImagesAndUpdateProduct;
