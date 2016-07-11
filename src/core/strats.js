import _ from './utils';

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

export {
  strats, mergeOptions
}
