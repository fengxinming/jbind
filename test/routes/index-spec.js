'use strict';

module.exports = function(request) {
  describe('GET /', function () {
    it('should return 200', function (done) {
      request.get('/').expect(200, done);
    });
  });
};