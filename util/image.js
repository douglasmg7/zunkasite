'use strict';

const log = require('../config/log');
const fs = require('fs')  
const path = require('path')  
const axios = require('axios');
const Product = require('../model/product');

// Check aldo product quantity.
async function downloadProductImage(linkg, product_id) {
    try {
        const url = 'https://unsplash.com/photos/AaEQmoufHLk/download?force=true'
        const path = Path.resolve(__dirname, 'images', 'code.jpg')
        const writer = Fs.createWriteStream(path)

        const response = await Axios({
            url,
            method: 'GET',
            responseType: 'stream'
        })

        response.data.pipe(writer)

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })
    } catch(err) {
        return cb(new Error(`Downloading image product. catch: ${err}`));
    }
};

module.exports.checkAldoProductQty = checkAldoProductQty;
