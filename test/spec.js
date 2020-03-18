const request = require('supertest');
const assert = require('chai').assert;
const s = require('../config/s');

describe('Testing API', function () {
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
    it('/', function testRoot(done) {
        request(server)
            .get('/')
            .expect(200, done);
    });
    it('/admin/banner', function testBanner(done) {
        request(server)
            .get('/admin/banner')
            .end((err, res)=>{
                assert.equal(res.statusCode, 200);
                done();
            });
    });
    // it('/admin', function testBanner(done) {
        // request(server)
            // .get('/admin/banner')
            // .expect(200, done);
    // });
    it('404', function test404(done) {
        request(server)
            .get('/foo/bar')
            .expect(404, done);
    });

    // Zoom API.
    describe("Zoom API", ()=>{
        // Invalid auth.
        // it('/ext/zoom/order-status - inválid auth', function testBanner(done) {
            // request(server)
                // .post('/ext/zoom/order-status')
                // .auth(s.zunkaSite.user, "111")
                // .send({ "orderNumber": "5015679200", "status": "New" })
                // .end((err, res)=>{
                    // assert.equal(res.body, "");
                    // assert.equal(res.statusCode, 200);
                    // done();
                // });
        // });
        // Invalid status.
        it('/ext/zoom/order-status - inválid status', function testBanner(done) {
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .send({ "orderNumber": "5015679200", "status": "Deleted" })
                .expect(400, "Unknown status: ", done);
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
        it('/ext/zoom/order-status', function testBanner(done) {
            request(server)
                .post('/ext/zoom/order-status')
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .send({ "orderNumber": "5015679200", "status": "New" })
                .end((err, res)=>{
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
    });
});