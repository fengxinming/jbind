import _ from './utils';

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

export default function() {
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
