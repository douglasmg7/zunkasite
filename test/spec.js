'use strict';
const request = require('supertest');
const assert = require('chai').assert;
const expect = require('chai').expect;
const s = require('../config/s');
const nock = require('nock');
const Product = require('../model/product');
const Order = require('../model/order');

// Array with newest products.
let newestProducts;

describe('Zunka', function () {

    // Start and stop server.
    let server;
    before(function (done) {
        this.timeout(8000);
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
    describe("Site", ()=>{
        // Root page.
        it('/', done=>{
            request(server)
                .get('/')
                .expect(200, done);
        });
        // New products API.
        it('/api/new-products', done=>{
            request(server)
                .get('/api/new-products')
                .expect(200)
                .end((err, res)=>{
                    newestProducts = JSON.parse(res.text).products;
                    // console.log(`newestProducts.length: ${newestProducts.length}`);
                    expect(newestProducts).to.have.length.above(2);
                    done();
                });
        });
        // Banner admin page.
        it('Banner configuration', done=>{
            request(server)
                .get('/admin/banner')
                .end((err, res)=>{
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
        // Not found.
        it('404', function test404(done) {
            request(server)
                .get('/foo/bar')
                .expect(404, "Página não encontrada.", done);
        });
    });

    // Zoom API.
    describe("Zoom API", ()=>{
        const zoomOrderId = '31559839856'; 
        const zoomOrderTest = require(`./zoom/order-${zoomOrderId}.json`);

        // Invalid auth.
        it('Inválid authorization', done=>{
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zoomInternalAuth.user, "111")
                .send({ "orderNumber": "5015679200", "status": "New" })
                .expect(401, /Unauthorised/, done);
        });
        // Hello.
        it('Hello', done=>{
            request(server)
                .get('/ext/zoom/hello')
                .auth(s.zoomInternalAuth.user, s.zoomInternalAuth.password)
                .expect(200, /Hello!/, done);
        });
        // Invalid status.
        it('Order status invalid', done=>{
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zoomInternalAuth.user, s.zoomInternalAuth.password)
                .send({ "orderNumber": "5015679200", "status": "Deleted" })
                .expect(400, /Unknown status: /, done);
        });
        // New order.
        it('Order status new ', done=>{
            this.timeout(10000);
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zoomInternalAuth.user, s.zoomInternalAuth.password)
                .send({ "orderNumber": zoomOrderId, "status": "New" })
                .expect(200, done);
        });
        // Approved payment order - product not exist.
        it('Order status approved Payment (produto não existe)', done=>{
            this.timeout(6000);
            // Mock request.
            nock(s.zoom.host)
                .get(`/order/${zoomOrderId}`)
                .reply(200, zoomOrderTest);
            // Url request.
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zoomInternalAuth.user, s.zoomInternalAuth.password)
                .send({ "orderNumber": zoomOrderId, "status": "ApprovedPayment" })
                .expect(500, 'Product(s) out of stock.', done);
        });
        // Order status approved Payment.
        it('Order status approved Payment', done=>{
            this.timeout(6000);
            // Request products in stock.
            zoomOrderTest.items = [
                {
                    "amount": 2,
                    "total": newestProducts[0].storeProductPrice * 2,
                    "product_id": newestProducts[0]._id,
                    "product_name": newestProducts[0].storeProductTitle,
                    "product_price": newestProducts[0].storeProductPrice
                },
                {
                    "amount": 2,
                    "total": newestProducts[1].storeProductPrice * 2,
                    "product_id": newestProducts[1]._id,
                    "product_name": newestProducts[1].storeProductTitle,
                    "product_price": newestProducts[1].storeProductPrice
                }
            ];
            // console.log(`zoomOrderTest: ${JSON.stringify(zoomOrderTest, null, 2)}`);
            // Mock request.
            nock(s.zoom.host)
                .get(`/order/${zoomOrderId}`)
                .reply(200, zoomOrderTest);
            // console.log(`stock product 1: ${newestProducts[0].storeProductQtd}`);
            // console.log(`stock product 2: ${newestProducts[1].storeProductQtd}`);
            // Add stock product to test sell.
            Product.updateMany({ _id: { $in:  [newestProducts[0]._id, newestProducts[1]._id] }}, { $inc: { storeProductQtd: 2 }}, err=>{
                expect(err).to.be.null
                // Approved payment.
                request(server)
                    .post('/ext/zoom/order-status')
                    .auth(s.zoomInternalAuth.user, s.zoomInternalAuth.password)
                    .send({ "orderNumber": zoomOrderId, "status": "ApprovedPayment" })
                    .end((err, res)=>{
                        expect(res.statusCode).to.be.equal(200);
                        // Check if order was created.
                        Order.find({}, {}).sort({"timestamps.placedAt": -1}).limit(1)
                            .then(docs=>{
                                let orderDb = docs[0];
                                expect(orderDb).to.not.be.null;
                                expect(orderDb.externalOrderNumber).to.not.be.empty;
                                expect(orderDb.externalOrderNumber).to.be.equal(zoomOrderTest.order_number);
                                expect(orderDb.timestamps).to.not.be.null;
                                expect(orderDb.timestamps.paidAt).to.not.be.null;
                                // console.log(`orderDb.timestamps.placedAt: ${JSON.stringify(orderDb.timestamps.placedAt, null, 2)}`);
                                // Now less 5 min.
                                let someMunutesEarly = new Date();
                                someMunutesEarly.setMinutes(someMunutesEarly.getMinutes - 2);
                                // console.log(`type of orderDb.timestamps.paidAt: ${typeof orderDb.timestamps.paidAt}`);
                                expect(orderDb.timestamps.paidAt).to.not.be.above(someMunutesEarly);
                                expect(orderDb.items, "No one order item").to.not.be.empty;
                                // Total price
                                let totalPrice = 0;
                                zoomOrderTest.items.forEach(item=>{
                                    totalPrice += item.total;
                                });
                                if (zoomOrderTest.total_discount_value) { totalPrice -= zoomOrderTest.total_discount_value };
                                expect(parseFloat(orderDb.subtotalPrice)).to.be.above(0);
                                // console.log(`orderDb.subtotalPrice: ${orderDb.subtotalPrice}`);
                                // console.log(`totalPrice: ${totalPrice}`);
                                expect(parseFloat(orderDb.subtotalPrice)).to.be.equal(totalPrice);
                                expect(parseFloat(orderDb.totalPrice)).to.be.equal(totalPrice + zoomOrderTest.shipping.freight_price);
                                expect(orderDb.user_id.toString()).to.be.equal('123456789012345678901234');
                                expect(orderDb.name).to.be.equal(zoomOrderTest.customer.first_name);
                                expect(orderDb.email).to.be.equal('zoom@zoom.com.br');
                                expect(orderDb.cpf).to.be.equal(zoomOrderTest.customer.cpf);
                                expect(orderDb.mobileNumber).to.be.equal(zoomOrderTest.customer.user_phone);
                                done();
                                // // Delete created test order.
                                // order.remove(err=>{
                                    // expect(err).to.be.null;
                                    // done();
                                // });
                            }).catch(err=>{
                                console.log(err.stack);
                            });
                        });
            });

        });
        // Canceled order.
        it('Order status canceled', done=>{
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zoomInternalAuth.user, s.zoomInternalAuth.password)
                .send({ "orderNumber": "31559839856", "status": "Canceled" })
                .end((err, res)=>{
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
    });
});