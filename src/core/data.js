'use strict';

import _ from './utils';

/**
 * 针对数据绑定内置事件
 * @param {Data || DataArray} up
 * @param {String} key
 * @param {*} value
 * @param {Boolean} trigger or not
 */
function _prefix(up, key, value, trigger) {
  var top = up._top,
    isArray = _isArray(value),
    options = {
      data: value,
      up: up,
      top: top,
      namespace: key + '',
      trigger: isArray ? false : trigger
    },
    // old value
    oldVal = top.data ? top.data(up.$namespace(key)) : undefined;

  if (typeof value === 'object' && value !== null) {
    up[key] = isArray ?
      new DataArray(options) :
      new Data(options);

    // 数据改变时触发
    trigger && up.$change(up.$namespace(key), up[key], oldVal);
  } else if (oldVal !== value) {
    up[key] = value;
    // 数据改变时触发
    trigger && up.$change(up.$namespace(key), value, oldVal);
  }
  if (!(~up._keys.indexOf(key))) {
    up._keys.push(key);
  }
}

function _isArray(obj) {
  return Array.isArray(obj) || obj instanceof DataArray;
}

function _getLength(keys) {
  return keys.filter(function(key) {
    return typeof key === 'number';
  }).length;
}

/**
 * Data Class
 * @class
 * @param {Object} options
 */
function Data(options) {
  var data = options.data,
    keys = Object.keys(options.data || {})
    .filter(function(key) {
      return key.indexOf('_') !== 0;
    })
    .map(function(num) {
      return +num + '' === num ? +num : num;
    }),
    self = this;

  _.extend(this, data);

  // 被绑定数据对象的key
  this._keys = keys;
  // 父对象数据容器
  this._up = options.up;
  // 顶层数据容器
  this._top = options.top || this;
  // 数据的命名空间
  this._namespace = options.namespace || '';
  keys.forEach(function(key) {
    _prefix(self, key, data[key], options.trigger);
  });
  // 如果是数组对象，需要得到长度
  _isArray(data) && (this.length = _getLength(keys));
}

/**
 * DataArray
 * 跟Array类似的对象
 * @class
 * @param {Object} options
 */
function DataArray(options) {
  Data.call(this, options);
}

/**
 * Seed
 * @param {Object} options
 */
function Seed(options) {
  Data.call(this, options);
}

function initialize() {
  _.extend(Data.prototype, {
    /**
     * 获取命名空间
     */
    $namespace: function(key) {
      var keys = [],
        self = this;
      for (; self != undefined; self = self._up) {
        self._namespace &&
          keys.unshift(self._namespace);
      }
      if (key) {
        keys.push(key);
      }
      return keys.join('.');
    },
    /**
     * 获取父级命名空间
     */
    $key: function() {
      var key = this._namespace;
      return +key + '' === key ? +key : key;
    },
    /**
     * 获取数据的父级对象
     */
    $up: function(num) {
      num = num || 1;
      for (var src = this; num--;) {
        src = src['_up'];
      }
      return src;
    },
    /**
     * 修改绑定的数据值
     */
    $set: function(key, value) {
      if (typeof key === 'object') {
        var self = this;
        Object.keys(key).filter(function(k) {
          return k.indexOf('_') !== 0;
        }).forEach(function(k) {
          _prefix(self, k, key[k], true);
        });
        this.$change(this.$namespace(key), this, undefined, 1);
      } else {
        var oldValue = this[key];
        _prefix(this, key, value, true);
        // just bubble
        this.$change(this.$namespace(key), this[key], oldValue, undefined, -1);
      }
      return this;
    },
    /**
     * 获取实际值
     */
    $get: function() {
      var res, keys = this._keys,
        self = this;
      if (this instanceof Data) {
        res = {};
      } else {
        res = [];
      }
      keys.forEach(function(key) {
        res[key] = self[key] == null ?
          self[key] :
          self[key].$get ?
          self[key].$get() :
          self[key];
      });
      return res;
    },
    /**
     * 数据改变时触发
     * type = 0 just change
     * type = 1 trigger change & deep
     * type = -1 just deep
     */
    $change: function(key, value, oldVal, patch, type) {
      type = type || 0;
      var top = this._top;
      if (top.$emit) {
        ~type && this._top.$emit('data:' + key, value, oldVal, patch);
        type && this._top.$emit('deep:' + key, value, oldVal, patch);
      }
    }
  });

  _.extend(DataArray.prototype, Data.prototype, {
    /**
     * push data
     */
    push: function(values) {
      values = _.slice.call(arguments, 0);
      var res = [];
      for (var i = 0, l = values.length; i < l; i++) {
        _prefix(this, this.length, values[i]);
        this._keys.push(this.length);
        res.push(this[this.length]);
        this.length++;
      }
      // value, oldValue, patch
      this.$change(this.$namespace(), this, null, {
        method: 'push',
        res: res,
        args: values
      }, 1);

      return this;
    },
    /**
     * pop data
     */
    pop: function() {
      var res = this[--this.length];
      delete this[this.length];
      this._keys.pop();
      this.$change(this.$namespace(), this, null, undefined, 1);
      return res;
    },
    /**
     * unshift
     */
    unshift: function(value) {
      this._keys.push(this.length);
      this.length++;
      for (var l = this.length; l--;) {
        this[l] = this[l - 1];
        // fixed namespace
        typeof this[l] === 'object' &&
          (this[l]._namespace = l + '');
      }
      _prefix(this, 0, value);
      this.$change(this.$namespace(), this, null, undefined, 1);
      return this;
    },
    /**
     * shift
     */
    shift: function() {
      this.length--;
      var res = this[0];
      for (var i = 0, l = this.length; i < l; i++) {
        this[i] = this[i + 1];
        // fixed namespace
        typeof this[i] === 'object' &&
          (this[i]._namespace = i + '');
      }
      this._keys.pop();
      delete this[this.length];
      this.$change(this.$namespace(), this, null, undefined, 1);
      return res;
    },
    /**
     * touch
     */
    touch: function(key) {
      this.$change(this.$namespace(key), this, null, undefined, 1);
    },
    /**
     * indexOf
     */
    indexOf: function(item) {
      if (item._up === this) {
        var i = +item._namespace;
        if (this[i] === item) return i;
      } else if (typeof item !== 'object') {
        for (var i = 0, l = this.length; i < l; i++) {
          if (this[i] === item) return i;
        }
      }
      return -1;
    },
    /**
     * splice
     */
    splice: function(i, l /**, items support later **/ ) {
      var patch = {
        method: 'splice',
        args: [i, l]
      };
      for (var j = 0, k = l + i, z = this.length - l; i < z; i++, j++) {
        this[i] = this[k + j];
        typeof this[i] === 'object' &&
          (this[i]._namespace = i + '');
      }
      for (; i < this.length; i++) {
        this[i] = null;
        delete this[i];
      }
      this.length -= l;
      this._keys.splice(this.length, l);
      this.$change(this.$namespace(), this, null, patch, 1);
    },
    /**
     * forEach
     */
    forEach: function(foo) {
      for (var i = 0, l = this.length; i < l; i++) {
        foo(this[i], i);
      }
    },
    /**
     * filter
     */
    filter: function(foo) {
      var res = [];
      this.forEach(function(item, i) {
        if (foo(item)) res.push(item);
      });
      return res;
    }
  });

  _.extend(Seed, {
    Data: Data,
    DataArray: DataArray
  });
  _.extend(Seed.prototype, Data.prototype, {
    /**
     * 设置值到元素上
     *
     * @param {String} key
     * @param {*} value
     * @returns {Data}
     */
    data: function(key, value) {
      if (key === undefined) {
        return this;
      }
      var i = 0,
        l, data = this,
        next;
      if (~key.indexOf('.')) {
        var keys = key.split('.');
        for (l = keys.length; i < l - 1; i++) {
          key = keys[i];
          // number
          if (+key + '' === key) {
            key = +key;
          }
          if (key in data && data[key] != null) {
            data = data[key];
          } else if (value === undefined) {
            // undefind
            return undefined;
          } else {
            next = keys[i + 1];
            // next is number
            if (+next + '' == next) {
              // array
              _prefix(data, key, [], true);
            } else {
              // object
              _prefix(data, key, {}, true);
            }
          }
        }
      }
      l && (key = keys[i]);
      // 如果 data === undefined, 就返回结果
      if (value === undefined) {
        return data && key ? data[key] : data;
      }
      data.$set(key, value);
      return data[key];
    }
  });

  return Seed;
}


export {
  initialize as initSeed
};
