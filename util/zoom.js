'use strict';
const log = require('../config/log');
const axios = require('axios');
const s = require('../config/s');
const zoomOrderJson = require('../test/zoom/order-31559839856.json');
// console.log(`zoomOrderJson.status: ${zoomOrderJson.status}`);

// Get zoom order.
function getZoomOrder(orderId, cb){
    // if (process.env.NODE_ENV == 'development') {
    if (process.env.NODE_ENV == 'nothing') {
        // zoomOrderJson.status = 'New';
        // zoomOrderJson.status = 'Approvedpayment';
        // zoomOrderJson.status = 'Processed';
        // zoomOrderJson.status = 'Shipped';
        // zoomOrderJson.status = 'Delivered';
        log.debug('Getting zoom order from json file.');
        log.debug(`zoomOrderJson.status: ${zoomOrderJson.status}`);
        zoomOrderJson.status = zoomOrderJson.status.toLowerCase();
        return cb(null, zoomOrderJson);
    } else {
        // log.debug('Getting zoom order from zoom server.');
        // todo - comment and redirect s.zoom to production.
        // log.debug(`Getting zoom order from zoom server. URL: ${s.zoom.host}/order/${orderId}`);
        axios.get(`${s.zoom.host}/order/${orderId}`, {
            headers: {
                "Accept": "application/json", 
            },
            auth: {
                username: s.zoom.user,
                password: s.zoom.password
            },
        })
            .then(response => {
                // log.debug(`zoom orders: ${JSON.stringify(response.data, null, 2)}`);
                if (response.data.err) {
                    return cb(new Error(`Get zoom order ${orderId}. ${response.data.err}`), null)
                } 
                if (response.data.status) {
                    response.data.status = response.data.status.toLowerCase();
                }
                return cb(null, response.data); 
            })
            .catch(err => {
                log.error(`catch - Get zoom order, id: ${orderId}. ${err.stack}`);
            }); 
    }
}

// Set zoom order processed.
function setOrderProcessed(orderId, cb){
    axios.post(`${s.zoom.host}/order/${orderId}/processed`, {
        auth: {
            username: s.zoom.user,
            password: s.zoom.password
        },
    })
        .then(response => {
            console.log(`zoom orders: ${JSON.stringify(response.data, null, 2)}`);
            if (response.data.err) {
                return cb(new Error(`Get zoom order ${orderId}. ${response.data.err}`), null)
            } 
            return cb(null); 
        })
        .catch(err => {
            log.error(`catch - Set zoom order processed, id: ${orderId}. ${err.stack}`);
        }); 
}

// Print all zoom orders.
function getAllZoomOrders(cb){
    axios.get(`${s.zoom.host}/orders`, {
        headers: {
            "Accept": "application/json", 
        },
        auth: {
            username: s.zoom.user,
            password: s.zoom.password
        },
    })
        .then(response => {
            if (response.data.err) {
                return cb(new Error(`Get all zoom orders. ${response.data.err}`), null)
            } 
            // console.log(`zoom orders: ${JSON.stringify(response.data, null, 2)}`);
            return cb(null, response.data); 
        })
        .catch(err => {
            log.error(`catch - Get all zoom orders. ${err}`);
        }); 
}

module.exports.getZoomOrder = getZoomOrder;
