'use strict';

const vinylFs = require('vinyl-fs');
const clean = require('gulp-clean');
const util = require('util');

module.exports = function (src, resolve, reject) {
	vinylFs.src(src, {
		read : false
	})
	.on('error', function (evt) {
		if (util.isFunction(reject)) {
			reject(evt);
		}
	})
	.on('end', function () {
		if (util.isFunction(resolve)) {
			setTimeout(function() {
				resolve();
			}, 100);
		}
	})
	.pipe(clean());
};
