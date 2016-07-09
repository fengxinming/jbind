'use strict';

const vinylFs = require('vinyl-fs');
const jshint = require('gulp-jshint');
const stylish = require('jshint-stylish');
const util = require('util');
const co = require('co');

module.exports = co.wrap(function*(src) {
  return new Promise(function(resolve, reject) {
    vinylFs.src(src)
      .pipe(jshint('.jshintrc'))
      .on('error', function(err) {
        reject(err);
      }).on('end', function() {
        resolve();
      })
      .pipe(jshint.reporter(stylish));
  });
});
