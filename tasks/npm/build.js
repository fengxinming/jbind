'use strict';

const fs = require('fs');
const rollup = require('rollup');

const version = process.env.VERSION || require('../../package.json').version

const banner =
  '/*!\n' +
  ' * Master.js v' + version + '\n' +
  ' * (c) ' + (new Date()).getFullYear() + ' jesse\n' +
  ' * Released under the MIT License.\n' +
  ' */';

function getSize(code) {
  return (code.length / 1024).toFixed(2) + 'kb';
}

function blue(str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}

function write(dest, code) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(dest, code, function(err) {
      if (err) return reject(err);
      console.log(blue(dest) + ' ' + getSize(code));
      resolve()
    })
  })
}

rollup.rollup({
    entry: 'src/index.js'
  })
  .then(function(bundle) {
    return write('dist/jbind.js', bundle.generate({
      // output format - 'amd', 'cjs', 'es6', 'iife', 'umd'
      // amd – 使用像requirejs一样的银木块定义
      // cjs – CommonJS，适用于node和browserify / Webpack
      // es6 (default) – 保持ES6的格式
      // iife – 使用于<script> 标签引用的方式
      // umd – 适用于CommonJs和AMD风格通用模式
      format: 'umd',
      banner: banner,
      moduleName: 'Master'
    }).code)
  })
  .catch(function(e) {
    console.log(e);
  });
