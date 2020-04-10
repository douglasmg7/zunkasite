'use strict';
const log = require('../config/log');
const axios = require('axios');
const s = require('../config/s');
const zoomOrder31559839856 = require('../test/zoom/order-31559839856.json');

// Get zoom order.
function getZoomOrder(orderId, cb){
    // todo - remove test.
    if (process.env.NODE_ENV == 'development') {
        // zoomOrder31559839856.status = 'new';
        zoomOrder31559839856.status = 'approvedpayment';
        return cb(null, zoomOrder31559839856);
    } else {
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
                // console.log(`zoom orders: ${JSON.stringify(response.data, null, 2)}`);
                if (response.data.err) {
                    return cb(new Error(`Get zoom order ${orderId}. ${response.data.err}`), null)
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
