'use strict';

var nanomatch = require('../../..');

module.exports = function(args) {
  if (typeof args[1] !== 'string') {
    return nanomatch.apply(nanomatch, args).length > 0;
  }
  return nanomatch.isMatch.apply(nanomatch, args);
};
