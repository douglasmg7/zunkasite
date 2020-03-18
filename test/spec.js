let request = require('supertest');
let assert = require('chai').assert;

describe('Testing API', function () {
    let server;
    before(function (done) {
        this.timeout(4000);
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
});