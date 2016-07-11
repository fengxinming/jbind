/*!
 * Master.js v1.0.0
 * (c) 2016 jesse
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Master = factory());
}(this, function () { 'use strict';

  var noop = function() {};
  var defer = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    setTimeout;
  var cache = new(require('./cache'))(1000);
  var priorities = ['vm', 'repeat', 'if'];
  var _slice = [].slice;
  var _alpaca = document.getElementsByTagName('html')[0];
  var slice = function() {
      try {
        _slice.call(document.body.childNodes);
        return _slice;
      } catch (e) {
        return function(i) {
          i = i || 0;
          var res = [],
            l = this.length;
          for (; i < l; i++) {
            res.push(this[i]);
          }
          return res;
        };
      }
    }();
  _alpaca && (_alpaca = _alpaca.getAttribute('alpaca'));

  function _loopPriority(el, res, setting) {
    var attr, tmp;

    // 优先解析内置指令
    for (var j = 0, l = priorities.length; j < l; j++) {
      attr = 'j-' + priorities[j];
      if (tmp = el.getAttribute(attr)) {
        res.push({
          name: attr,
          value: tmp
        });

        el.removeAttribute(attr);
        // 存在内置指令
        return true;
      }
    }
  }

  function walk($el, cb, setting) {
    setting = setting || {};
    var i, j, l, el, atts, res, qtid;
    for (i = 0; el = $el[i++];) {
      if (el.nodeType === 1) {
        atts = el.attributes;
        res = [];

        // 循环查找内置指令
        if (!_loopPriority(el, res, setting)) {
          // 循环查找其它指令
          for (j = 0, l = atts.length; j < l; j++) {
            atts[j].name.indexOf('j-') === 0 &&
              res.push({
                name: atts[j].name,
                value: atts[j].value
              })
          }
        }
        if (res.length > 0) {
          cb(el, res, setting);
        }
      }
      if (el.childNodes.length && !setting.stop) {
        walk(slice.call(el.childNodes, 0), cb, setting);
      }
      // 重新设置stop=false
      setting.stop = false;
    }
  }

  var _ = {
    slice: slice,
    noop: noop,
    /**
     * 优先使用classList添加className
     *
     * @param {Element} el
     * @param {Strong} cls
     */
    addClass: function(el, cls) {
      if (el.classList) {
        el.classList.add(cls);
      } else {
        var cur = ' ' + (el.className || '') + ' ';
        if (cur.indexOf(' ' + cls + ' ') < 0) {
          el.className = (cur + cls).trim();
        }
      }
    },
    /**
     * 优先使用classList移除className
     *
     * @param {Element} el
     * @param {Strong} cls
     */
    removeClass: function(el, cls) {
      if (el.classList) {
        el.classList.remove(cls);
      } else {
        var cur = ' ' + (el.className || '') + ' ',
          tar = ' ' + cls + ' ';
        while (cur.indexOf(tar) >= 0) {
          cur = cur.replace(tar, ' ');
        }
        el.className = cur.trim();
      }
    },
    noexist: function(vm, name) {
      this.warn(vm);
      throw new Error('Filter ' + name + ' hasn\'t implemented.');
    },
    warn: function() {
      return (window.console && console.error) ? function() {
        console.error.apply(console, arguments);
      } : noop;
    }(),
    isObject: function(o) {
      return typeof o === 'object';
    },
    nextTick: function(cb, ctx) {
      return ctx ?
        defer(function() {
          cb.call(ctx)
        }, 0) :
        defer(cb, 0);
    },
    /**
     * 获得一个命名空间字符串
     * @param {String} namespace
     * @param {String} key
     * @returns {String}
     */
    get: function(namespace, key) {
      var arr = [];
      namespace && arr.push(namespace);
      key && arr.push(key);
      return arr.join('.').replace(/^(.+\.)?\$top\./, '');
    },
    walk: walk,
    /**
     * html上的alpaca属性
     */
    alpaca: !!_alpaca
  };

  var $ = require('jquery');

  var _$1 = {
    find: $.find,
    contains: $.contains,
    data: $.data,
    cleanData: $.cleanData,
    add: $.event.add,
    remove: $.event.remove,
    clone: $.clone,
    extend: $.extend
  };

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

  /**
   * DataArray
   * 跟Array类似的对象
   * @class
   * @param {Object} options
   */
  function DataArray(options) {
    Data.call(this, options);
  }
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

  /**
   * Seed
   * @param {Object} options
   */
  function Seed(options) {
    Data.call(this, options);
  }
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

  function emit(key, args, target) {
    // 触发事件
    target = target || this;
    var cbs = this._events[key];
    if (cbs) {
      var i = 0;
      cbs = cbs.length > 1 ?
        _.slice.call(cbs, 0) :
        cbs;
      for (var l = cbs.length; i < l; i++) {
        cbs[i].apply(target, args);
      }
    }
    // 没有data: hook: deep: 才触发事件
    if (key.indexOf('data:') && key.indexOf('hook:') && key.indexOf('deep:') && this.$parent) {
      emit.call(this.$parent, key, args, target);
    }
  }

  function callChange(key, args) {
    var self = {
      _events: this._watchers
    };
    emit.call(self, key, args);
    emit.call(self, key + '**deep**', args);
  }

  function callDeep(key, args) {
    var props, nArgs,
      keys = key.split('.'),
      self = {
        _events: this._watchers
      };

    for (keys.pop(); keys.length > 0; keys.pop()) {
      key = keys.join('.');
      props = key + '**deep**';
      // 移除旧的值
      emit.call(self, props, [this.data(key)]);
    }
    // vm改变时触发
    emit.call(self, '**deep**', [this]);
  }

  var events = {
    emit: emit,
    callChange: callChange,
    callDeep: callDeep
  };

  var strats = {};
  strats.created =
    strats.ready =
    strats.attached =
    strats.detached =
    strats.compiled =
    strats.beforeDestroy =
    strats.destroyed =
    strats.paramAttributes = function(parentVal, childVal) {
      return childVal ?
        parentVal ?
        parentVal.concat(childVal) :
        Array.isArray(childVal) ?
        childVal : [childVal] :
        parentVal;
    };
  strats.data =
    strats.filters =
    strats.methods =
    strats.directives = function(parentVal, childVal) {
      if (!childVal) return parentVal;
      if (!parentVal) return childVal;
      return _.extend({}, parentVal, childVal);
    };

  var defaultStrat = function(parentVal, childVal) {
    return childVal === undefined ?
      parentVal :
      childVal;
  };

  /**
   * 合并参数
   *
   * @param {*} parentVal
   * @param {*} childVal
   * @param {J} [vm]
   */
  function mergeOptions(parent, child, vm) {
    var options = {},
      key;
    for (key in parent) {
      merge(key);
    }
    for (key in child) {
      if (!(parent.hasOwnProperty(key))) {
        merge(key);
      }
    }

    function merge(key) {
      var strat = strats[key] || defaultStrat;
      options[key] = strat(parent[key], child[key], vm, key);
    }
    return options;
  }

  var methods = {
    'default': {
      // 循环移除dom
      clean: function(parentNode, repeats) {
        if (repeats.length) {
          repeats.forEach(function(node) {
            node.parentNode === parentNode &&
              parentNode.removeChild(node);
          });
          _.cleanData(repeats);
          repeats.length = 0;
        }
      },
      insert: function(parentNode, fragment, ref) {
        parentNode.insertBefore(fragment, ref);
      }
    },
    push: {
      insert: function(parentNode, fragment, ref) {
        parentNode.insertBefore(fragment, ref);
      },
      dp: function(data, patch) {
        return patch.res;
      }
    },
    splice: {
      clean: function(parentNode, repeats, value, watchers) {
        var i = value[0],
          l = value[1],
          target = value[2].$namespace(),
          eles = repeats.splice(i, l);
        eles.forEach(function(ele) {
          parentNode.removeChild(ele);
        });
        // 只删除一次
        if (!value.done) {
          splice(watchers, target, i, l);
          value.done = true;
        }
        return true;
      },
      dp: function(data, patch) {
        patch.args.push(data);
        return patch.args;
      }
    }
  };

  function splice(watchers, target, i, l) {
    var length = target.length,
      subKey,
      cur,
      index,
      newKey;
    Object.keys(watchers).forEach(function(key) {
      if (~key.indexOf(target)) {
        subKey = key.substring(length + 1);
        cur = subKey.split('.');
        if (cur.length) {
          index = +cur.shift();
          if ((index -= l) >= i) {
            cur.unshift(index);
            cur.unshift(target);
            newKey = cur.join('.');
            watchers[newKey] = watchers[key];
            delete watchers[key];
          }
        }
      }
    });
  }

  function repeat() {
    var tpl = this.el,
      setting = this.setting,
      parentNode = tpl.parentNode,
      key, namespace, target, readFilters, repeats, ref, vm;
    // 如果是模板或者已经停止检索，就直接return
    if (!parentNode || setting.stop) {
      return;
    }

    // 停止检索
    setting.stop = true;

    key = this.target;
    namespace = this.namespace;
    target = _.get(namespace, key);
    readFilters = this.filters;
    repeats = [];
    ref = document.createComment('q-repeat');
    vm = this.vm;

    parentNode.replaceChild(ref, tpl);

    vm.$watch(target, function(value, oldVal, patch) {
      value = vm.applyFilters(value, readFilters);
      // 如果value为空，就返回
      if (value === null || typeof value === 'undefined') {
        return;
      }
      var method = (!readFilters.length && patch) ? patch.method : 'default',
        dp = (methods[method] || {}).dp,
        clean = (methods[method] || {}).clean,
        insert = (methods[method] || {}).insert;

      dp && (value = dp(value, patch));

      if (clean && clean(parentNode, repeats, value, vm._watchers, target) === true) {
        return;
      }

      var fragment = document.createDocumentFragment(),
        itemNode;

      value.forEach(function(obj, i) {
        itemNode = _.clone(tpl);
        vm._templateBind(itemNode, {
          data: obj,
          namespace: obj.$namespace(),
          immediate: true
        });

        repeats.push(itemNode);
        fragment.appendChild(itemNode);
      });

      insert && insert(parentNode, fragment, ref);
      vm.$emit('repeat-render');
    }, false, true);
  }

  var directives = {
    cloak: {
      bind: function() {
        var vm = this.vm,
          el = this.el;

        // 加载完成之后执行
        vm.$once('hook:ready', function() {
          // 如果有数据变化
          vm.$once('datachange', function() {
            el.removeAttribute('j-cloak');
          });
        });
      }
    },
    show: function(value) {
      var el = this.el;
      if (value) {
        el.style.display = '';
        var display = el.currentStyle ?
          el.currentStyle.display :
          getComputedStyle(el, null).display;
        if (display === 'none') {
          el.style.display = 'block';
        }
      } else {
        el.style.display = 'none';
      }
    },
    'class': function(value) {
      var el = this.el,
        arg = this.arg;
      if (arg) {
        value ?
          _.addClass(el, arg) :
          _.removeClass(el, arg);
      } else {
        if (this.lastVal) {
          _.removeClass(el, this.lastVal);
        }
        if (value) {
          _.addClass(el, value);
          this.lastVal = value;
        }
      }
    },
    value: function(value) {
      var el = this.el;
      if (el.type === 'checkbox') {
        el.checked = value;
      } else {
        el.value = value;
      }
    },
    attr: function(value) {
      if (value === undefined) return;
      var arg = this.arg,
        el = this.el;
      // 如果属性是style
      if (arg === 'style') {
        if (typeof value === 'object') {
          for (var k in value) {
            if (value.hasOwnProperty(k)) {
              el.style[k] = value[k];
            }
          }
        } else {
          el.setAttribute(arg, value);
        }
      } else {
        if (arg in el) {
          el[arg] = value;
        } else {
          el.setAttribute(arg, value);
        }
      }
    },
    text: function(value) {
      var text;

      value !== undefined &&
        (text = (typeof this.el.textContent === 'string') ?
          'textContent' : 'innerText') &&
        (this.el[text] =
          value == null ?
          '' :
          value.toString());
    },
    html: function(value) {
      this.el.innerHTML = value && value.toString() || '';
    },
    on: {
      bind: function() {
        var self = this,
          key = this.target,
          param = this.param,
          filters = this.filters,
          vm = this.vm,
          handler = vm.applyFilters(this.vm[key], filters),
          data = param && (~param.indexOf('this')) && self.data();
        _.add(this.el, this.arg, function(e) {
          if (!handler || typeof handler !== 'function') {
            return _.warn('You need implement the ' + key + ' method.');
          }
          var args = [];
          param ?
            param.forEach(function(arg) {
              if (arg === 'e') {
                args.push(e);
              } else if (arg === 'this') {
                args.push(data);
              } else if (arg === 'true') {
                args.push(true);
              } else if (arg === 'false') {
                args.push(false);
              } else if (+arg + '' === arg) {
                args.push(+arg);
              } else if (arg.match(/^(['"]).*\1$/)) {
                args.push(arg.slice(1, -1));
              } else {
                args.push(self.data(arg));
              }
            }) :
            args.push(e);

          handler.apply(vm, args);
        });
      }
    },
    model: {
      bind: function() {
        var keys = ((this.namespace ? this.namespace + '.' : '') + this.target).split('.'),
          key = keys.pop(),
          namespace = keys.join('.'),
          el = this.el,
          vm = this.vm,
          data = vm.data(namespace),
          composing = false;
        _.add(el, 'input propertychange change', function(e) {
          if (composing) return;
          data.$set(key, el.value);
        });
        _.add(el, 'compositionstart', function(e) {
          composing = true;
        });
        _.add(el, 'compositionend', function(e) {
          composing = false;
        });
      },
      update: function(value) {
        if (this.el.value !== value) {
          this.el.value = value;
        }
      }
    },
    vm: {
      bind: function() {
        // 停止扫描
        this.setting.stop = true;

        // 选择component
        var name = this.target,
          vm = this.vm,
          el = this.el,
          // 关联的component
          ref = el.getAttribute('j-ref') || false,
          Child = vm.constructor.require(name),
          data = Child.options.data,
          options,
          childVm;

        options = {
          el: el,
          data: data,
          _parent: vm
        };

        childVm = new Child(options);

        vm._children.push(childVm);
        ref && ! function() {
          var refs = vm.$[ref];
          refs ?
            refs.length ?
            (refs.push(childVm)) :
            (vm.$[ref] = [refs, childVm]) :
            (vm.$[ref] = childVm);
        }();
      }
    },
    'if': {
      bind: function() {
        // 如果元素是模板就退出
        if (!this.el.parentNode) {
          return;
        }

        var tpl = this.el,
          parentNode = tpl.parentNode,
          ref = document.createComment('j-if'),
          hasInit = false,
          exist = true,
          key = this.target,
          namespace = this.namespace,
          target = _.get(namespace, key),
          readFilters = this.filters,
          data = this.data(),
          vm = this.vm;

        this.setting.stop = true;

        function _init(value) {
          // 如果值不存在，就不处理
          if (hasInit || !exist || !value) {
            return;
          }
          hasInit = true;
          vm._templateBind(tpl, {
            data: data,
            namespace: namespace,
            immediate: true
          });
        }

        vm.$watch(target, function(value, oldVal) {
          value = vm.applyFilters(value, readFilters, oldVal);

          _init(value);
          // 如果value不存在，就不处理
          if (value === exist) {
            return;
          }
          // 如果value正常，就把注释替换模板
          if (value === true) {
            parentNode.replaceChild(tpl, ref);
            exist = value;
            // 如果value不正常，就把模板替换注释
          } else if (value === false) {
            parentNode.replaceChild(ref, tpl);
            exist = value;
          }

          _init(value);
        }, typeof this.data(key) === 'object', true);
      }
    },
    el: {
      bind: function() {
        this.vm.$$[this.target] = this.el;
      }
    },
    repeat: repeat
  };

  var modules = {};
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

  var clas = {
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

  /**
   * A doubly linked list-based Least Recently Used (LRU)
   * cache. Will keep most recently used items while
   * discarding least recently used items when its limit is
   * reached. This is a bare-bone version of
   * Rasmus Andersson's js-lru:
   *
   *   https://github.com/rsms/js-lru
   *
   * @param {Number} limit
   * @constructor
   */

  function Cache(limit) {
    this.size = 0
    this.limit = limit
    this.head = this.tail = undefined
    this._keymap = {}
  }

  var p = Cache.prototype

  /**
   * Put <value> into the cache associated with <key>.
   * Returns the entry which was removed to make room for
   * the new entry. Otherwise undefined is returned.
   * (i.e. if there was enough room already).
   *
   * @param {String} key
   * @param {*} value
   * @return {Entry|undefined}
   */

  p.put = function(key, value) {
    var removed

    var entry = this.get(key, true)
    if (!entry) {
      if (this.size === this.limit) {
        removed = this.shift()
      }
      entry = {
        key: key
      }
      this._keymap[key] = entry
      if (this.tail) {
        this.tail.newer = entry
        entry.older = this.tail
      } else {
        this.head = entry
      }
      this.tail = entry
      this.size++
    }
    entry.value = value

    return removed
  }

  /**
   * Purge the least recently used (oldest) entry from the
   * cache. Returns the removed entry or undefined if the
   * cache was empty.
   */

  p.shift = function() {
    var entry = this.head
    if (entry) {
      this.head = this.head.newer
      this.head.older = undefined
      entry.newer = entry.older = undefined
      this._keymap[entry.key] = undefined
      this.size--
    }
    return entry
  }

  /**
   * Get and register recent use of <key>. Returns the value
   * associated with <key> or undefined if not in cache.
   *
   * @param {String} key
   * @param {Boolean} returnEntry
   * @return {Entry|*}
   */

  p.get = function(key, returnEntry) {
    var entry = this._keymap[key]
    if (entry === undefined) return
    if (entry === this.tail) {
      return returnEntry ? entry : entry.value
    }
    // HEAD--------------TAIL
    //   <.older   .newer>
    //  <--- add direction --
    //   A  B  C  <D>  E
    if (entry.newer) {
      if (entry === this.head) {
        this.head = entry.newer
      }
      entry.newer.older = entry.older // C <-- E.
    }
    if (entry.older) {
      entry.older.newer = entry.newer // C. --> E
    }
    entry.newer = undefined // D --x
    entry.older = this.tail // D. --> E
    if (this.tail) {
      this.tail.newer = entry // E. <-- D
    }
    this.tail = entry
    return returnEntry ? entry : entry.value
  }

var   cache$1 = new Cache(1000);
  var tokens = [
      // space
      [/^ +/],
      // arg
      [/^([\w\-]+):/, function(captures, status) {
        status.token.arg = captures[1];
      }],
      // function
      [/^([\w]+)\((.+?)\)/, function(captures, status) {
        status.token.target = captures[1];
        status.token.param = captures[2].split(/ *, */);
      }],
      // target
      [/^([\w\-\.\$]+)/, function(captures, status) {
        status.token.target = captures[1];
      }],
      // filter
      [/^(?=\|)/, function(captures, status) {
        status.filter = true;
      }],
      // next
      [/^,/, function(captures, status, res) {
        res.push(status.token);
        status.token = {
          filters: []
        };
      }]
    ];
  var filterREG = /^(.+?)(?=,|$)/;
  var filterTokens = [
      // space
      [/^ +/],
      // filter
      [/^\| *([\w\-\!]+)/, function(captures, filters) {
        filters.push([captures[1]]);
      }],
      // string
      [/^(['"])(((\\['"])?([^\1])*)+)\1/, function(captures, filters) {
        filters[filters.length - 1].push(captures[3]);
      }],
      // arg
      [/^([\w\-\$]+)/, function(captures, filters) {
        filters[filters.length - 1].push(captures[1]);
      }]
    ];
  /**
   * click: onclick | filter1 | filter2
   * click: onclick , keydown: onkeydown
   * click: onclick(this)
   * click: onclick(e, this)
   * value1 | filter1 | filter2
   * value - 1 | filter1 | filter2   don't support
   */
  function parse(str) {
    var name = str,
      hit = cache$1.get(name);
    if (hit) return hit;

    var res = [],
      captures,
      i,
      l = tokens.length,
      foo,
      // if has token or not
      has = false,
      status = {
        // if in filter or not
        filter: false,
        // just token object
        token: {
          filters: []
        }
      };

    while (str.length) {
      for (i = 0; i < l; i++) {
        if (captures = tokens[i][0].exec(str)) {
          has = true;
          foo = tokens[i][1];
          foo && foo(captures, status, res);
          str = str.replace(tokens[i][0], '');
          if (status.filter) {
            captures = filterREG.exec(str);
            parseFilter(captures[0].trim(), status.token);
            str = str.replace(filterREG, '');
            status.filter = false;
          }
          break;
        }
      }
      if (has) {
        has = false;
      } else {
        throw new Error('Syntax error at: ' + str);
      }
    }

    res.push(status.token);
    cache$1.put(name, res);
    return res;
  }

  function parseFilter(str, token) {
    var i, l = filterTokens.length,
      has = false;
    while (str.length) {
      for (i = 0; i < l; i++) {
        if (captures = filterTokens[i][0].exec(str)) {
          has = true;
          foo = filterTokens[i][1];
          foo && foo(captures, token.filters);
          str = str.replace(filterTokens[i][0], '');
          break;
        }
      }
      if (has) {
        has = false;
      } else {
        throw new Error('Syntax error at: ' + str);
      }
    }
  }

  function templateBind(el, options) {
    options = options || {};

    var self = this,
      directives = self.$options.directives,
      index = options.index,
      data = options.data || self,
      namespace = options.namespace;

    _.walk([el], function(node, res, setting) {
      res.forEach(function(obj) {
        var name = obj.name.substring(2),
          directive = directives[name],
          descriptors = parse(obj.value);
        directive &&
          descriptors.forEach(function(descriptor) {
            var readFilters = self._makeReadFilters(descriptor.filters, self.data(namespace)),
              key = descriptor.target,
              target = _.get(namespace, key),
              update = _.isObject(directive) ? directive.update : directive,
              that = _.extend({
                el: node,
                vm: self,
                data: function(key) {
                  return self.data(_.get(namespace, key));
                },
                namespace: namespace,
                setting: setting
              }, descriptor, {
                filters: readFilters
              }),
              tmp = that.data(key);

            update && self.$watch(target, function(value, oldValue) {
              value = self.applyFilters(value, readFilters, oldValue);
              update.call(that, value, oldValue);
            }, typeof tmp === 'object', _.alpaca ? false : typeof options.immediate === 'boolean' ? options.immediate : (tmp !== undefined));
            if (_.isObject(directive) && directive.bind) directive.bind.call(that);
          });
      });
    });
  };

  function factory(_) {

    var MARK = /\{\{(.+?)\}\}/,
      _doc = document;

    function _inDoc(ele) {
      return _.contains(_doc.documentElement, ele);
    }

    /**
     * J
     * @class
     * @param {Object} options
     */
    function J(options) {
      this._init(options);
    }
    // 导出utils
    J._ = _;
    J.options = {
      directives: directives,
      filters: {}
    };

    /**
     * get
     * @param {String | Element} selector
     * @return {J}
     */
    J.get = function(selector) {
      var ele = _.find(selector)[0];
      if (ele) {
        return _.data(ele, 'JI');
      } else {
        return new this({
          el: selector
        });
      }
    };
    /**
     * all
     * @param {Object} options
     */
    J.all = function(options) {
      var self = this;
      return _.find(options.el).map(function(ele) {
        return new self(_.extend(options, {
          el: ele
        }));
      });
    };
    _.extend(J, clas);
    _.extend(J.prototype, {
      _init: function(options) {
        options = options || {};
        this.$el = options.el &&
          typeof options.el === 'string' ?
          _.find(options.el)[0] :
          options.el;
        // 元素的引用集合
        this.$$ = {};
        // set parent vm
        this.$parent = options._parent;
        // 合并参数
        options = this.$options = mergeOptions(
          this.constructor.options,
          options,
          this
        );
        // 执行状态
        this._isCompiled = false;
        this._isAttached = false;
        this._isReady = false;
        // 时间存储
        this._events = {};
        this._watchers = {};

        // components
        this._children = [];
        // components references
        this.$ = {};

        Seed.call(this, options);
        // this._data = options.data;
        // 初始化数据和继承scope
        this._initScope();
        // 触发hook:created事件
        this._callHook('created');
        // 开始扫描
        if (this.$el) {
          // 缓存实例对象
          _.data(this.$el, 'JI', this);
          this.$mount(this.$el);
        }
      },
      /**
       * 监听事件
       *
       * @param {String} event
       * @param {Function} fn
       */
      $on: function(event, fn) {
        (this._events[event] || (this._events[event] = [])).push(fn);
        return this;
      },
      /**
       * 调用一次就被自动移除
       *
       * @param {String} event
       * @param {Function} fn
       */
      $once: function(event, fn) {
        var self = this;

        function on() {
          self.$off(event, on);
          fn.apply(this, arguments);
        }
        on.fn = fn;
        this.$on(event, on);
        return this;
      },

      /**
       * 移除注册事件
       *
       * @param {String} event
       * @param {Function} fn
       */

      $off: function(event, fn) {
        var cbs, cb, i;

        if (!arguments.length) {
          this._events = {};
          return this;
        }

        cbs = this._events[event];
        if (!cbs) {
          return this;
        }
        if (arguments.length === 1) {
          this._events[event] = null;
          return this;
        }

        i = cbs.length;
        while (i--) {
          cb = cbs[i];
          if (cb === fn || cb.fn === fn) {
            cbs.splice(i, 1);
            break;
          }
        }
        return this;
      },
      /**
       * 监听一个表达式，当值发生改变时触发
       *
       * @param {String} exp
       * @param {Function} cb
       * @param {Boolean} [deep]
       * @param {Boolean} [immediate]
       * @return {Function} - unwatchFn
       */
      $watch: function(exp, cb, deep, immediate) {
        var key = deep ? exp + '**deep**' : exp;
        (this._watchers[key] || (this._watchers[key] = []))
        .push(cb);
        immediate && cb(this.data(exp));
        return this;
      },
      /**
       * 在本身的对象上触发一个事件
       *
       * @param {String} e
       */
      $emit: function(e) {
        var args = _.slice.call(arguments, 1);
        events.emit.call(this, e, _.slice.call(args, 0));
        // emit data change
        if (!e.indexOf('data:')) {
          e = e.substring(5);
          events.callChange.call(this, e, _.slice.call(args, 0));
        }
        if (!e.indexOf('deep:')) {
          e = e.substring(5);
          events.callDeep.call(this, e, _.slice.call(args, 0));
          args.unshift(e);
          events.emit.call(this, 'datachange', args);
        }
        return this;
      },

      _initScope: function() {
        this._initMethods();
      },

      _initMethods: function() {
        var methods = this.$options.methods,
          key;
        if (methods) {
          for (key in methods) {
            this[key] = methods[key].bind(this);
          }
        }
      },

      /**
       *
       * @param {String|Element|DocumentFragment} el
       * @public
       */
      $mount: function(el) {
        if (this._isCompiled) {
          return _.warn('$mount() should be called only once');
        }
        this._compile(el);
        this._isCompiled = true;
        this._callHook('compiled');
        if (_inDoc(this.$el)) {
          this._callHook('attached');
          this._ready();
        } else {
          this.$once('hook:attached', this._ready);
        }
      },

      /**
       * 开始触发hook:ready
       */
      _ready: function() {
        this._isAttached = true;
        this._isReady = true;
        this._callHook('ready');
      },

      /**
       * @param {Element} el
       * @return {Element}
       */
      _compile: function(el) {
        this.transclude(el, this.$options);
      },
      /**
       *
       * @param {Element} el
       * @param {Object} options
       */
      transclude: function(el, options) {
        // 绑定模板
        this._templateBind(el, options);
      },

      /**
       * 绑定模板私有方法
       */
      _templateBind: templateBind,

      /**
       * 触发钩子事件
       *
       * @param {String} hook
       */
      _callHook: function(hook) {
        var handlers = this.$options[hook];
        if (handlers) {
          for (var i = 0, j = handlers.length; i < j; i++) {
            handlers[i].call(this);
          }
        }
        this.$emit('hook:' + hook);
      },

      _makeReadFilters: function(names, $this) {
        if (!names.length) return [];
        var filters = this.$options.filters,
          self = this;
        return names.map(function(args) {
          args = _.slice.call(args, 0);
          var name = args.shift();
          var reader = (filters[name] ? (filters[name].read || filters[name]) : _.noexist(self, name));
          return function(value, oldVal) {
            // 合并args
            var thisArgs = [value].concat(args || []),
              i = thisArgs.indexOf('$this');
            thisArgs.push(oldVal);
            // 重新设置 $this
            if (~i) {
              thisArgs[i] = $this;
            }
            return args ?
              reader.apply(self, thisArgs) :
              reader.call(self, value, oldVal);
          };
        });
      },

      /**
       * 定义过滤器
       *
       * @param {*} value
       * @param {Array} filters
       * @param {*} oldVal
       * @return {*}
       */
      applyFilters: function(value, filters, oldVal) {
        if (!filters || !filters.length) {
          return value;
        }
        for (var i = 0, l = filters.length; i < l; i++) {
          value = filters[i].call(this, value, oldVal);
        }
        return value;
      }
    });

    _.extend(J.prototype, Seed.prototype);

    return J;
  };

  _$1.extend(_, _$1);
  var jbind = factory(_);

  return jbind;

}));