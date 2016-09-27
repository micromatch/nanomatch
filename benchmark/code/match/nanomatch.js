'use strict';

var nanomatch = require('../../..');

module.exports = function(args) {
  return nanomatch.match.apply(null, arguments);
};
