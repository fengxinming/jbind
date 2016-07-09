var utils = require('./core/utils'),
    _ = require('./adapter/utils.jquery'),
    factory = require('./core/factory')

_.extend(utils, _);
module.exports = factory(utils);
