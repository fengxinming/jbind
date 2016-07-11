'use strict';

import {
  mergeOptions
}
from './strats';

var modules = {},
  listeners = {};

function _define(name, options) {
  if (modules[name]) return false;
  var module = modules[name] = this.extend(options || {});
  return module;
}

function _require(name, callback) {
  return modules[name] || this;
}

function _create(o) {
  function F() {}
  F.prototype = o;
  return new F();
}

function _extend(extendOptions) {
  extendOptions = extendOptions || {};
  var Super = this,
    Sub = createClass(extendOptions.name || 'JComponent');
  Sub.prototype = _create(Super.prototype);
  Sub.prototype.constructor = Sub;
  Sub.options = mergeOptions(
    Super.options,
    extendOptions
  );
  Sub['super'] = Super;
  ['extend', 'get', 'all', 'require', 'define'].forEach(function(key) {
    Sub[key] = Super[key];
  })
  return Sub;
}

function createClass(name) {
  return new Function(
    'return function ' + name +
    ' (options) { this._init(options) }'
  )();
}

export default {
  /**
   * 定义一个component
   * @param {String} name
   * @param {Object} options
   */
  define: _define,
  /**
   * require
   * require(name)
   * require(names, callback)
   * 获取一个component
   * @param {String} name
   * @param {Array} names
   * @param {Function} callback
   */
  require: _require,
  /**
   * class继承
   * @param {Object} options
   */
  extend: _extend
};
