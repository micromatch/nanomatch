'use strict';

var util = require('util');
var path = require('path');
var bash = require('./support/bash');
var patterns = require('./patterns');
var assert = require('assert');
var extend = require('extend-shallow');
var argv = require('yargs-parser')(process.argv.slice(2));
var del = require('delete');
var mc = require('micromatch');
var mi = require('minimatch');
var mm = require('multimatch');
var nm = require('..');
var matcher = argv.mm ? mm : nm;

function match(fixtures, pattern, expected, options) {
  var opts = extend({}, options);
  opts.bash = opts.bash || {};

  var actual = matcher(fixtures, pattern, opts);
  expected.sort(compare);
  actual.sort(compare);

  var msg = inspect(pattern)
    + ' '
    + inspect(actual)
    + ' '
    + inspect(expected);

  function compareRefs() {
    var bashRes = opts.bash.skip !== true ? bash(fixtures, pattern, opts).sort(compare) : [];
    var muRes = mm(fixtures, pattern, opts).sort(compare)
    var mcRes = mc(fixtures, pattern, opts).sort(compare);
    var miRes = mi.match(fixtures, pattern, opts).sort(compare);
    var nmRes = actual;

    console.log('options:', opts);

    console.log('bash:', bashRes, bashRes.length);
    console.log('nanomatch:', nmRes, nmRes.length);
    console.log('micromatch:', mcRes, mcRes.length);
    console.log('minimatch:', miRes, miRes.length);
    console.log('multimatch:', muRes, muRes.length);
  }

  try {
    assert.deepEqual(actual, expected, msg);

    if (argv.compare) {
      compareRefs();
    }

    if (argv.regex) {
      console.log('minimatch re:', mi.makeRe(pattern, opts));
      console.log('micromatch re:', mc.makeRe(pattern, opts));
      console.log('nanomatch re:', nm.makeRe(pattern, opts));
    }

  } catch (err) {
    compareRefs();
    throw err;
  }
}

describe('basic tests', function() {
  before(function(cb) {
    del(path.join(__dirname, 'fixtures'), cb);
  });

  patterns.forEach(function(unit, i) {
    // if (unit[0] !== 'a?b') return;

    it(i + ': ' + unit[0], function() {
      if (typeof unit === 'string') {
        console.log();
        console.log(' ', unit);
        return;
      }

      // update fixtures list
      if (typeof unit === 'function') {
        return unit();
      }

      var pattern = unit[0];
      var expected = (unit[1] || []).sort(compare);
      var options = unit[2] || {};
      var fixtures = unit[3] || patterns.fixtures;
      match(fixtures, pattern, expected, options);
    });
  });
});

function inspect(val) {
  return util.inspect(val, {depth: null});
}

function compare(a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}
