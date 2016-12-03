'use strict';

var isTravis = process.env.CI || process.env.TRAVIS;
var isWindows = require('is-windows');
var assert = require('assert');
var bash = require('bash-match');
var mm = require('minimatch');
var nm = require('..');

var fixtures = require('./_fixtures');
var patterns = require('./_patterns');

describe('.isMatch', function() {
  if (isWindows() || isTravis) {
    console.log('these tests use bash to test for bash parity. since bash does not work on most versions of windows, these tests are skipped on windows');
    return;
  }

  patterns.forEach(function(pattern) {
    fixtures.forEach(function(fixture) {
      it('should match ' + fixture + ' with ' + pattern, function() {
        var mmRes = mm(fixture, pattern);
        var nmRes = nm.isMatch(fixture, pattern);
        var bRes = bash.isMatch(fixture, pattern);

        assert(nmRes === bRes || nmRes === mmRes, fixture + ' ' + pattern);
      });

      it('should match ' + fixture + ' with ' + pattern + ' and {dot: true}', function() {
        var mmRes = mm(fixture, pattern, {dot: true});
        var nmRes = nm.isMatch(fixture, pattern, {dot: true});
        var bRes = bash.isMatch(fixture, pattern, {dot: true});
        assert(nmRes === bRes || nmRes === mmRes, fixture + ' ' + pattern);
      });
    });
  });
});
