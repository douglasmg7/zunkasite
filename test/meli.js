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
        let n_no_application_id = {  
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
                .send(n_no_application_id)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.text).to.be.equal(`Unknown application_id: ${n_no_application_id.application_id}`);
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
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.text).to.be.equal(`Unknown application_id: ${n_wrong_application_id.application_id}`);
                    done();
                });
        });

        // No user id.
        let n_no_user_id = {  
            "resource":"/orders/2195160686",
            "topic":"orders_v2",
            "application_id": process.env.MERCADO_LIVRE_APP_ID,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - no user_id', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_no_user_id)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.text).to.be.equal(`Unknown user_id: ${n_no_user_id.user_id}`);
                    done();
                });
        });
        // Wrong user id.
        let n_wrong_user_id = {  
            "resource":"/orders/2195160686",
            "user_id": 468424240,
            "topic":"orders_v2",
            "application_id": process.env.MERCADO_LIVRE_APP_ID,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - wrong user_id', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_wrong_user_id)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.text).to.be.equal(`Unknown user_id: ${n_wrong_user_id.user_id}`);
                    done();
                });
        });

        // No topic.
        let n_no_topic = {  
            "resource":"/orders/2195160686",
            "user_id": process.env.MERCADO_LIVRE_USER_ID,
            "application_id": process.env.MERCADO_LIVRE_APP_ID,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - no topic', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_no_topic)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.text).to.be.equal(`Unknown topic: ${n_no_topic.topic}`);
                    done();
                });
        });
        // Wrong topic.
        let n_wrong_topic = {  
            "resource":"/orders/2195160686",
            "user_id": process.env.MERCADO_LIVRE_USER_ID,
            "topic":"orders_v1",
            "application_id": process.env.MERCADO_LIVRE_APP_ID,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - wrong topic', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_wrong_topic)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.text).to.be.equal(`Unknown topic: ${n_wrong_topic.topic}`);
                    done();
                });
        });

        // No resource.
        let n_no_resource = {  
            "user_id": process.env.MERCADO_LIVRE_USER_ID,
            "topic":"orders_v2",
            "application_id": process.env.MERCADO_LIVRE_APP_ID,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - no resource', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_no_resource)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.text).to.be.equal(`Unknown resource: ${n_no_resource.resource}`);
                    done();
                });
        });

        // Wrong start resource.
        let n_wrong_resource = {  
            "resource":"/wrong/1234",
            "user_id": process.env.MERCADO_LIVRE_USER_ID,
            "topic":"orders_v2",
            "application_id": process.env.MERCADO_LIVRE_APP_ID,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - wrong start resource', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_wrong_resource)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.text).to.be.equal(`Unknown resource: ${n_wrong_resource.resource}`);
                    done();
                });
        });

        // No order resource.
        let n_no_orders_resource = {  
            "resource":"/orders/",
            "user_id": process.env.MERCADO_LIVRE_USER_ID,
            "topic":"orders_v2",
            "application_id": process.env.MERCADO_LIVRE_APP_ID,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - no orders resource', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_no_orders_resource)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.text).to.be.equal(`No orders for resource: ${n_no_orders_resource.resource}`);
                    done();
                });
        });

        // One order resource.
        let n_one_order_resource = {  
            "resource":"/orders/1234",
            "user_id": process.env.MERCADO_LIVRE_USER_ID,
            "topic":"orders_v2",
            "application_id": process.env.MERCADO_LIVRE_APP_ID,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - one order resource', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_one_order_resource)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.text).to.be.equal(`Received meli notification orders_v2 with orders: 1234`);
                    done();
                });
        });

        // Two order resource.
        let n_two_order_resource = {  
            "resource":"/orders/1234,2345",
            "user_id": process.env.MERCADO_LIVRE_USER_ID,
            "topic":"orders_v2",
            "application_id": process.env.MERCADO_LIVRE_APP_ID,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it('/ext/meli/notifications - two order resource', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_two_order_resource)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.text).to.be.equal(`Received meli notification orders_v2 with orders: 1234, 2345`);
                    done();
                });
        });

        // One valid order resource.
        let n_one_valid_order_resource = {  
            "resource":"/orders/5396664429",
            "user_id": process.env.MERCADO_LIVRE_USER_ID,
            "topic":"orders_v2",
            "application_id": process.env.MERCADO_LIVRE_APP_ID,
            "attempts":1,
            "sent":"2019-10-30T16:19:20.129Z",
            "received":"2019-10-30T16:19:20.106Z"
        };
        it.only('/ext/meli/notifications - one valid order resource', done=>{
            request(server)
                .post('/ext/meli/notifications')
                .send(n_one_valid_order_resource)
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(200);
                    // expect(res.text).to.be.equal(`Received meli notification orders_v2 with orders: 5396664429`);
                    expect(res.text).to.be.equal(``);
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