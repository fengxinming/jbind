'use strict';

import {
  initSeed
}
from './data';
import events from './events';
import directives from './directives';
import clas from './class';
import templateBind from './templateBind'
import {
  mergeOptions
}
from './strats';

export default function(_) {

  var MARK = /\{\{(.+?)\}\}/,
    _doc = document,
    Seed = initSeed();

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
