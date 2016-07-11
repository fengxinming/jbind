'use strict';

import Data from './data';
import _ from './utils';

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

export default {
  emit: emit,
  callChange: callChange,
  callDeep: callDeep
};
