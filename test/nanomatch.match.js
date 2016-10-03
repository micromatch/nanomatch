'use strict';

var assert = require('assert');
var argv = require('yargs-parser')(process.argv.slice(2));
var matcher = argv.mm ? require('minimatch') : require('..');

function match(arr, pattern, expected, options) {
  var actual = matcher.match(arr, pattern, options);
  assert.deepEqual(actual.sort(), expected.sort());
}

describe('.match method', function() {
  it('should return an array of matches for a literal string', function() {
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], '(a/b)', ['a/b']);
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], 'a/b', ['a/b']);
  });

  it('should support regex logical or', function() {
    match(['a/a', 'a/b', 'a/c'], 'a/(a|c)', ['a/a', 'a/c']);
    match(['a/a', 'a/b', 'a/c'], 'a/(a|b|c)', ['a/a', 'a/b', 'a/c']);
  });

  it('should support regex ranges', function() {
    match(['a/a', 'a/b', 'a/c'], 'a/[b-c]', ['a/b', 'a/c']);
    match(['a/a', 'a/b', 'a/c', 'a/x/y', 'a/x'], 'a/[a-z]', ['a/a', 'a/b', 'a/c', 'a/x']);
  });

  it('should support negation patterns', function() {
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], '!a/b', ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], '!a/(b)', ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], '!(a/b)', ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
  });
});
