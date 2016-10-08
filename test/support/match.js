'use strict';

var assert = require('assert');
var argv = require('yargs-parser')(process.argv.slice(2));
var mm = require('multimatch');
mm.multimatch = true;
var nm = require('../..');

var matcher = argv.mm ? mm : nm;
if (argv.mi) {
  matcher = require('minimatch').match;
  matcher.minimatch = true;
}

function compare(a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}

module.exports = function(fixtures, pattern, expected, options) {
  if (!Array.isArray(expected)) {
    var tmp = expected;
    expected = options;
    options = tmp;
  }

  fixtures = Array.isArray(fixtures) ? fixtures : [fixtures];
  var actual = matcher(fixtures, pattern, options);
  actual.sort(compare);
  expected.sort(compare);
  assert.deepEqual(actual, expected);
};

module.exports.isMatch = function() {
  var fn = argv.mm ? mm : nm.isMatch;
  return fn.apply(matcher, arguments);
};
