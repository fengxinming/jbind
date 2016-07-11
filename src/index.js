import utils from './core/utils';
import _ from './adapter/utils.jquery.js';
import factory from './core/factory';

_.extend(utils, _);
var jbind = factory(utils);
export default jbind;
