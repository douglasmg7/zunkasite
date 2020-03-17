let request = require('supertest');
describe('Some test', function () {
    let server;
    beforeEach(function () {
        console.log("BEGIN");
        server = require('../bin/www');
    });
    afterEach(function () {
        server.close();
        console.log("FIM");
    });
    it('responds to /', function testSlash(done) {
        request(server)
            .get('/')
            .expect(200, done);
    });
    it('404 everything else', function testPath(done) {
        request(server)
            .get('/foo/bar')
            .expect(404, done);
    });
});