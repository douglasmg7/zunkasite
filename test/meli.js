'use strict';
const request = require('supertest');
const assert = require('chai').assert;
const expect = require('chai').expect;
const s = require('../config/s');
const nock = require('nock');
const Product = require('../model/product');
const Order = require('../model/order');
const User = require('../model/user');
const routeCheckout = require('../routes/routeCheckout');
const mobileNumber = require('../util/mobileNumber');

const path = require('path');
const fse = require('fs-extra');
const productUtil = require('../util/productUtil');

// Array with newest products.
let newestProducts;

describe('Zunka', function () {

    // Start and stop server.
    let server;
    before(function (done) {
        this.timeout(3000);
        server = require('../bin/www');


        setTimeout(function(){ done(); }, 1000);
    });
    after(function () {
        server.close(function(err) {
            if (err) {
                log.error(err.stack);
                process.exit(1)
            }
        });

    });

    // Site.
    describe("Meli", ()=>{
        // Root page.
        it('/', done=>{
            request(server)
                .get('/')
                .expect(200, done);
        });
        // No application id.
        let n_application_id = {  
            "resource":"/orders/2195160686",
            "user_id": 468424240,
            "topic":"orders_v2",
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - no application_id', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_application_id)
                .end((err, res)=>{
                    expect(400, /Unknown application_id: /, done);
                    done();
                });
        });
        // Wrong application id.
        let n_wrong_application_id = {  
            "resource":"/orders/2195160686",
            "user_id": 468424240,
            "topic":"orders_v2",
            "application_id": 5503910054141466,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - wrong application_id', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_wrong_application_id)
                .end((err, res)=>{
                    expect(400, /Unknown application_id: /, done);
                    done();
                });
        });

        // it('/meli/notifications - no application_id', done=>{
            // request(server)
                // .post('/meli/notifications')
                // .send({_id: _id, storeProductQtd: storeProductQtd})
                // .end((err, res)=>{
                    // newestProducts = JSON.parse(res.text).products;
                    // // console.log(`newestProducts.length: ${newestProducts.length}`);
                    // expect(newestProducts).to.have.length.above(2);
                    // expect(res.statusCode).to.be.equal(200);
                    // expect(400, /Unknown status: /, done);
                    // done();
                // });
        // });

    });
});