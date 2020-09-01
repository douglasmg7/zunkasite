'use strict';

const log = require('../config/log');
const fs = require('fs')  
const path = require('path')  
const axios = require('axios');
// Resize images.
const sharp = require('sharp');
const Product = require('../model/product');

// Download ao images product, create resized images and save product image list.
function downloadAldoImagesAndUpdateProduct(imagesLink, product) {
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

// Download allnations images product, create resized images and save product image list.
function downloadAllnationsImagesAndUpdateProduct(imageLink, item, product) {
    try {
        if (item == 0) {
            downloadAllnationsImagesAndUpdateProduct(imageLink, item + 1, product);
            return;
        } 
        if (item > 10) {
            return;
        }
        let imgageLinkComplete = imageLink + "-" + item.toString().padStart(2, "0"); 
        // log.debug(`imageLink: ${imageLink}`);
        log.debug(`Downloading image ${imgageLinkComplete}`);
        axios.get(imgageLinkComplete, { responseType: 'arraybuffer' })
            .then(response=>{
                // console.log(`size: ${response.data.length}`);
                // Imagens less than 3000 are unavailable images.
                if (response.data.length < 3000) {
                    return log.debug(`Downloaded image ${imgageLinkComplete} is "Imagem não Disponível"`);
                } else {
                    const pathOut = path.resolve(process.env.ZUNKA_SITE_PATH, 'dist/img', product._id.toString());
                    if (!fs.existsSync(pathOut)){
                        fs.mkdirSync(pathOut);
                    }
                    const fileOut = path.resolve(pathOut , path.basename("allnations-" + item.toString().padStart(2, "0") + '.jpeg'))
                    fs.writeFile(fileOut, response.data, function (err) {
                        if (err) {
                            return log.error(`Saving downloaded product image. ${err.stack}`);
                        }
                        log.debug(`Image for product ${product._id} was downloaded to ${fileOut}`);
                        // Create resized images.
                        createResizedImgs([fileOut]);
                        // Save product image list.
                        product.images.push(path.basename(fileOut));
                        product.save(err=>{
                            if (err) {
                                return log.error(`Saving product ${product._id} after downloading images.  ${err.stack}`);
                            }
                            downloadAllnationsImagesAndUpdateProduct(imageLink, item + 1, product);
                        })
                    });
                }
            })
            .catch(err=>{
                console.log(`Downloading product images (axios catch err): ${err}`);
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
			_0500: path.format({dir: pathObj.dir, name: pathObj.name + '_0500px', ext: pathObj.ext })
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
		// 0500 pixels.
		sharp(imgPath)
			.resize(500)
			.toFile(fileOut._0500, (err, info)=>{
				if (err) {
					log.error(err);
				}
				log.debug('Resized image was created: ' + fileOut._0500);
			});
	})
}

function downloadImage(imageLink, item) {
    if (item == 0) {
        downloadImage(imageLink, item + 1);
        return;
    } 
    if (item > 10) {
        return;
    }
    let imgageLinkComplete = imageLink + "-" + item.toString().padStart(2, "0"); 
    axios.get(imgageLinkComplete, { responseType: 'arraybuffer' })
        .then(response=>{
            console.log(`size: ${response.data.length}`);
            if (response.data.length < 3000) {
                return;
            } else {
                fs.writeFile(item.toString().padStart(2, "0") + '.jpeg', response.data, function (err) {
                    if (err) {
                        console.error(err);
                    }
                    console.log('Saved! - ' + item.toString());
                });
                downloadImage(imageLink, item + 1);
            }
        })
        .catch(err=>{
            console.log(`catch err: ${err}`);
        });
}


module.exports.createResizedImgs = createResizedImgs;
module.exports.downloadAldoImagesAndUpdateProduct = downloadAldoImagesAndUpdateProduct;
module.exports.downloadAllnationsImagesAndUpdateProduct = downloadAllnationsImagesAndUpdateProduct;
