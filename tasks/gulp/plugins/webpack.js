'use strict';

//webpack打包
const pathApi = require('path');
const named = require('vinyl-named');
const gutil = require('gulp-util');
const File = require('vinyl');
const MemoryFileSystem = require('memory-fs');
const through = require('through');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const clone = require('lodash.clone');
const some = require('lodash.some');
const clean = require('gulp-clean');

const defaultStatsOptions = {
    colors: gutil.colors.supportsColor,
    hash: false,
    timings: false,
    chunks: false,
    chunkModules: false,
    modules: false,
    children: true,
    version: true,
    cached: false,
    cachedAssets: false,
    reasons: false,
    source: false,
    errorDetails: false
};

function prepareFile(fs, compiler, outname) {
    let path = fs.join(compiler.outputPath, outname);
    if (path.indexOf('?') !== -1) {
        path = path.split('?')[0];
    }

    let contents = fs.readFileSync(path);

    let file = new File({
        base: compiler.outputPath,
        path: path,
        contents: contents
    });
    return file;
}

function gulpWebpack(options, wp, done) {
    options = clone(options) || {};
    let config = options.config || options;
    if (typeof done !== 'function') {
        let callingDone = false;
        done = function(err, stats) {
            if (err) {
                return;
            }
            stats = stats || {};
            if (options.quiet || callingDone) {
                return;
            }

            if (options.watch) {
                callingDone = true;
                setTimeout(function() {
                    callingDone = false;
                }, 500);
            }

            if (options.verbose) {
                gutil.log(stats.toString({
                    colors: gutil.colors.supportsColor
                }));
            } else {
                let statsOptions = options && options.stats || {};

                Object.keys(defaultStatsOptions).forEach(function(key) {
                    if (typeof statsOptions[key] === 'undefined') {
                        statsOptions[key] = defaultStatsOptions[key];
                    }
                });

                gutil.log(stats.toString(statsOptions));
            }
        };
    }

    let webpack = wp || require('webpack');
    let entry = [];
    let entries = Object.create(null);

    const stream = through(function(file) {
        if (file.isNull()) {
            return;
        }
        if ('relative' in file) {
            let fileNameParser = pathApi.parse(file.relative);
            let key = fileNameParser.dir + pathApi.sep + fileNameParser.name;
            if (!Array.isArray(entries[key])) {
                entries[key] = [];
            }
            entries[key].push(file.path);
        } else {
            entry = entry || [];
            entry.push(file.path);
        }
    }, function() {
        let self = this;
        let handleConfig = function(config) {
            config.output = config.output || {};
            config.watch = !!options.watch;

            if (Object.keys(entries).length > 0) {
                entry = entries;
                if (!config.output.filename) {
                    config.output.filename = '[name].js';
                }
            } else if (entry.length < 2) {
                entry = entry[0] || entry;
            }

            config.entry = config.entry || entry;
            config.output.path = config.output.path || process.cwd();
            config.output.filename = config.output.filename || '[hash].js';
            config.watch = options.watch;
            entry = [];

            if (!config.entry || config.entry.length < 1) {
                gutil.log('没有文件被打包编译');
                self.emit('end');
                return false;
            }
            return true;
        };

        let succeeded;
        if (Array.isArray(config)) {
            for (let i = 0; i < config.length; i++) {
                succeeded = handleConfig(config[i]);
                if (!succeeded) {
                    return false;
                }
            }
        } else {
            succeeded = handleConfig(config);
            if (!succeeded) {
                return false;
            }
        }

        let compiler = webpack(config, function(err, stats) {
            if (err) {
                self.emit('error', new gutil.PluginError('webpack-stream', err));
            }
            let jsonStats = stats.toJson() || {};
            let errors = jsonStats.errors || [];
            if (errors.length) {
                let errorMessage = errors.reduce(function(resultMessage, nextError) {
                    resultMessage += nextError.toString();
                    return resultMessage;
                }, '');
                self.emit('error', new gutil.PluginError('webpack-stream', errorMessage));
            }
            if (!options.watch) {
                self.queue(null);
            }
            done(err, stats);
            if (options.watch && !options.quiet) {
                gutil.log('webpack正在监视文件的改变');
            }
        });

        let handleCompiler = function(compiler) {
            if (options.watch && compiler.compiler) {
                compiler = compiler.compiler;
            }

            if (options.progress) {
                compiler.apply(new ProgressPlugin(function(percentage, msg) {
                    percentage = Math.floor(percentage * 100);
                    msg = percentage + '% ' + msg;
                    if (percentage < 10) msg = ' ' + msg;
                    gutil.log('webpack', msg);
                }));
            }

            let fs = compiler.outputFileSystem = new MemoryFileSystem();

            compiler.plugin('after-emit', function(compilation, callback) {
                Object.keys(compilation.assets).forEach(function(outname) {
                    if (compilation.assets[outname].emitted) {
                        let file = prepareFile(fs, compiler, outname);
                        self.queue(file);
                    }
                });
                callback();
            });
        };

        if (Array.isArray(options.config) && options.watch) {
            compiler.watchings.forEach(function(compiler) {
                handleCompiler(compiler);
            });
        } else if (Array.isArray(options.config)) {
            compiler.compilers.forEach(function(compiler) {
                handleCompiler(compiler);
            });
        } else {
            handleCompiler(compiler);
        }
    });

    let hasEntry = Array.isArray(config) ? some(config, function(c) {
        return c.entry;
    }) : config.entry;
    if (hasEntry) {
        stream.end();
    }

    return stream;
}

module.exports = gulpWebpack;