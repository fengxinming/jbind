'use strict';

import $ from 'jquery';

var util = {
  find: $.find,
  contains: $.contains,
  data: $.data,
  cleanData: $.cleanData,
  add: $.event.add,
  remove: $.event.remove,
  clone: $.clone,
  extend: $.extend
};

export default util;
