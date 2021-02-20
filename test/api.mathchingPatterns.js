'use strict';

var path = require('path');
var assert = require('assert');
var sep = path.sep;
var nm = require('./support/match');

describe('.matchingPatterns method', function() {
  describe('posix paths', function() {
    it('should return an array of matched patterns for a literal string', function() {
      assert.deepEqual(nm.matchingPatterns(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], '(a/b)'), ['a/b']);
      assert.deepEqual(nm.matchingPatterns(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], 'a/b'), ['a/b']);
      assert.deepEqual(nm.matchingPatterns(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], '(a/d)'), []);
      assert.deepEqual(nm.matchingPatterns(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], 'a/d'), []);
    });
  });
});
