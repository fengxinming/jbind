var noop = function() {},
  defer = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  setTimeout,
  cache = new(require('./cache'))(1000),
  //优先解析的指令
  priorities = ['vm', 'repeat', 'if'],
  _qtid = 0,
  _slice = [].slice,
  _alpaca = document.getElementsByTagName('html')[0],
  slice = function() {
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

export default {
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
