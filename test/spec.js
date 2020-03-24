const request = require('supertest');
const assert = require('chai').assert;
const expect = require('chai').expect;
const s = require('../config/s');
const nock = require('nock');
const Product = require('../model/product');

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
        it('/', function testRoot(done) {
            request(server)
                .get('/')
                .expect(200, done);
        });
        // New products API.
        it('/api/new-products', function testRoot(done) {
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
        it('Banner configuration', function testBanner(done) {
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
                // .end((err, res)=>{
                    // console.log(res.text);
                    // done();
                // });
        });
    });

    // Zoom API.
    describe("Zoom API", ()=>{
        const zoomOrderId = '31559839856'; 
        const zoomOrderJSON = require(`./zoom/order-${zoomOrderId}.json`);

        // Invalid auth.
        it('Inválid authorization', function testBanner(done) {
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zunkaSite.user, "111")
                .send({ "orderNumber": "5015679200", "status": "New" })
                .expect(401, /Unauthorised/, done);
        });
        // Invalid status.
        it('Order status invalid', function testBanner(done) {
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .send({ "orderNumber": "5015679200", "status": "Deleted" })
                .expect(400, /Unknown status: /, done);
                // .expect(400, "Unknown status: ", done);
                // .end((err, res)=>{
                    // console.log(`res: ${JSON.stringify(res, null, 2)}`);
                    // console.log(`res.text: ${res.text}`);
                    // assert.equal(res.text, "");
                    // assert.equal(res.body, "");
                    // assert.equal(res.statusCode, 200);
                    // done();
                // });
        });
        // New order.
        it('Order status new ', function testBanner(done) {
            this.timeout(10000);
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .send({ "orderNumber": zoomOrderId, "status": "New" })
                .end((err, res)=>{
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
        // Approved payment order - product not exist.
        it('Order status approved Payment (produto não existe)', function testBanner(done) {
            this.timeout(6000);
            // Mock request.
            nock(s.zoom.host)
                .get(`/order/${zoomOrderId}`)
                .reply(200, zoomOrderJSON);
            // Url request.
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .send({ "orderNumber": zoomOrderId, "status": "ApprovedPayment" })
                .end((err, res)=>{
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
        // Order status approved Payment.
        it('Order status approved Payment', function testBanner(done) {
            this.timeout(6000);
            // Request products in stock.
            zoomOrderJSON.items = [
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
            // console.log(`zoomOrderJSON: ${JSON.stringify(zoomOrderJSON, null, 2)}`);
            // Mock request.
            nock(s.zoom.host)
                .get(`/order/${zoomOrderId}`)
                .reply(200, zoomOrderJSON);
            console.log(`stock product 1: ${newestProducts[0].storeProductQtd}`);
            console.log(`stock product 2: ${newestProducts[1].storeProductQtd}`);
            // Add stock product to test sell.
            Product.updateMany({ _id: { $in:  [newestProducts[0]._id, newestProducts[1]._id] }}, { $inc: { storeProductQtd: 2 }}, err=>{
                expect(err).to.be.null
                // Url request.
                request(server)
                    .post('/ext/zoom/order-status')
                    .auth(s.zunkaSite.user, s.zunkaSite.password)
                    .send({ "orderNumber": zoomOrderId, "status": "ApprovedPayment" })
                    .end((err, res)=>{
                        assert.equal(res.statusCode, 200);
                        done();
                    });
            });

        });
        // Canceled order.
        it('Order status canceled', function testBanner(done) {
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .send({ "orderNumber": "31559839856", "status": "Canceled" })
                .end((err, res)=>{
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
    });
});