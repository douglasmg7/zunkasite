'use strict';
const log = require('../config/log');
const Markdown = require('./markdown');

let cache;
let warranties;

function updateCache(){
    cache = new Map();
    warranties = [""];
    Markdown.find()
    .then(docs=>{
        docs.forEach(doc=>{
            cache.set(doc.name, doc.markdown);
            // log.debug(`doc.name: ${doc.name}`);
            if (doc.name.startsWith('garantia-')) {
                warranties.push(doc.name.replace(/^garantia-/, ""));
            }
        });
        warranties.sort();
        // log.debug(`warranties: ${JSON.stringify(warranties)}`);
    })
    .catch(err=>{
        log.error(`Updating markdown cache. ${err}`);
    }); 
}

function getCache() {
    return cache;
}

module.exports.warranties = function() { return warranties; }

updateCache();

// setTimeout(()=>{
    // log.debug(`cache garantia: ${cache.get('garantia')}`)
    // log.debug(`garantia: ${JSON.stringify(Array.from(warrantyCache.keys()).sort())}`)
// }, 2000);

module.exports.getCache = getCache;
module.exports.updateCache = updateCache;
