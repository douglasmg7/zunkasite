const request = require('supertest');
const assert = require('chai').assert;
const s = require('../config/s');

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
        // Invalid auth.
        it('Inválid authorization', function testBanner(done) {
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zunkaSite.user, "111")
                .send({ "orderNumber": "5015679200", "status": "New" })
                .expect(401, /Unauthorised/, done);
        });
        // Invalid status.
        it('Inválid status', function testBanner(done) {
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
        it('New', function testBanner(done) {
            this.timeout(10000);
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .send({ "orderNumber": "31559839856", "status": "New" })
                .end((err, res)=>{
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
        // Approved payment order.
        it('Approved Payment', function testBanner(done) {
            this.timeout(6000);
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .send({ "orderNumber": "31559839856", "status": "ApprovedPayment" })
                .end((err, res)=>{
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
        // Canceled order.
        it('Canceled', function testBanner(done) {
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