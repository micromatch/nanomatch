'use strict';

var assert = require('assert');
var bash = require('./bash');

function compare(fixtures, pattern, actual, options, cb) {
  if (typeof actual !== 'string' && !Array.isArray(actual)) {
    throw new Error('`actual` value should be a string or array');
  }

  bash(fixtures, pattern, options, function(err, expected) {
    if (err) return cb(err);
    assert.deepEqual(actual, expected, pattern);
    cb();
  });
}
