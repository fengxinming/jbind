'use strict';

const jshint = require('./jshint');
const watcher = require('glob-watcher');

jshint(['src/**/*.js', '!src/core/cache.js']);

watcher(['src/**/*.js']).on('change', function(p) {
  jshint(p).then(null, function() {
    console.log(p, '校验完成');
  });
});
