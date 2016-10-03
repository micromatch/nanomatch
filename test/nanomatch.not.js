'use strict';

var assert = require('assert');
var argv = require('yargs-parser')(process.argv.slice(2));
var matcher = argv.mm ? require('minimatch') : require('..');

function match(arr, pattern, expected, options) {
  var actual = matcher.not(arr, pattern, options);
  assert.deepEqual(actual.sort(), expected.sort());
}

describe('.not method', function() {
  it('should return an array of matches for a literal string', function() {
    var fixtures = ['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'];
    match(fixtures, '(a/b)', ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
    match(fixtures, 'a/b', ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
  });

  it('should support regex logical or', function() {
    match(['a/a', 'a/b', 'a/c'], 'a/(a|c)', ['a/b']);
    match(['a/a', 'a/b', 'a/c'], 'a/(a|b|c)', []);
  });

  it('should support regex ranges', function() {
    match(['a/a', 'a/b', 'a/c'], 'a/[b-c]', ['a/a']);
    match(['a/a', 'a/b', 'a/c', 'a/x/y', 'a/x'], 'a/[a-z]', ['a/x/y']);
  });

  it('should support globs (*)', function() {
    var fixture = ['a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a'];
    match(fixture, 'a/*', ['a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    match(fixture, 'a/*/a', ['a/a', 'a/b', 'a/c', 'a/x', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a']);
    match(fixture, 'a/*/*', ['a/a', 'a/b', 'a/c', 'a/x', 'a/a/a/a', 'a/a/a/a/a']);
    match(fixture, 'a/*/*/*', ['a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a/a']);
    match(fixture, 'a/*/*/*/*', ['a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a']);
  });

  it('should support globstars (**)', function() {
    var fixture = ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];
    match(fixture, 'a/**', []);
    match(fixture, 'a/**/*', []);
    match(fixture, 'a/**/**/*', []);
  });

  it('should support negation patterns', function() {
    var fixture = ['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'];
    match(fixture, '!a/b', ['a/b']);
    match(fixture, '!a/(b)', ['a/b']);
    match(fixture, '!(a/b)', ['a/b']);
  });
});
