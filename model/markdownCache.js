'use strict';
const log = require('../config/log');
const Markdown = require('./markdown');

let cache;

function updateCache(){
    cache = new Map();
    Markdown.find()
    .then(docs=>{
        docs.forEach(doc=>{
            cache.set(doc.name, doc.markdown);
        });
    })
    .catch(err=>{
        log.error(`Updating markdown cache. ${err}`);
    }); 
}

function getCache() {
    return cache;
}

updateCache();

module.exports.getCache = getCache;
module.exports.updateCache = updateCache;
