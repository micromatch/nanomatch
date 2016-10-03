'use strict';

var assert = require('assert');
var argv = require('yargs-parser')(process.argv.slice(2));
var mm = require('minimatch');
var nm = require('..');
var matcher = argv.mm ? mm : nm;

function compare(a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}

function match(arr, pattern, expected, options) {
  var actual = matcher.match(arr, pattern, options);
  actual.sort(compare);
  expected.sort(compare);
  assert.deepEqual(actual, expected);
}

describe('dotfiles', function() {
  describe('file name', function() {
    it('should not match a dot when the dot is not explicitly defined', function() {
      assert(!nm.isMatch('.dot', '*dot'));
      assert(!nm.isMatch('.dot', '?dot'));
    });

    it('should match a dot when the dot is explicitly defined', function() {
      // first one is from minimatch tests
      var fixtures = ['a/b/.x/c', 'a/b/.x/c/d', 'a/b/.x/c/d/e', 'a/b/.x', 'a/b/.x/', 'a/.x/b', '.x', '.x/', '.x/a', '.x/a/b', 'a/.x/b/.x/c', '.x/.x'];
      var expected = ['.x/', '.x/a', '.x/a/b', 'a/.x/b', 'a/b/.x/', 'a/b/.x/c', 'a/b/.x/c/d', 'a/b/.x/c/d/e'];

      match(fixtures, '**/.x/**', expected);
      match('.dot', '[.]dot', ['.dot']);
      match('.dot', '.[d]ot', ['.dot']);
      match('.dot', '.dot*', ['.dot']);
      match('.dot', '.d?t', ['.dot']);
    });
  });

  describe('multiple directories', function() {
    it('should not match a dot when the dot is not explicitly defined', function() {
      assert(!nm.isMatch('/.dot', '**/*dot'));
      assert(!nm.isMatch('/.dot', '**/?dot'));
      assert(!nm.isMatch('/.dot', '*/*dot'));
      assert(!nm.isMatch('/.dot', '*/?dot'));
      assert(!nm.isMatch('/.dot', '/*dot'));
      assert(!nm.isMatch('/.dot', '/?dot'));
      assert(!nm.isMatch('a/.dot', '*/*dot'));
      assert(!nm.isMatch('a/.dot', '*/?dot'));
      assert(!nm.isMatch('a/b/.dot', '**/*dot'));
      assert(!nm.isMatch('a/b/.dot', '**/?dot'));
      assert(nm.isMatch('/.dot', '**/[.]dot'));
      assert(nm.isMatch('/.dot', '*/[.]dot'));
      assert(nm.isMatch('/.dot', '/[.]dot'));
      assert(nm.isMatch('a/.dot', '*/[.]dot'));
      assert(nm.isMatch('a/b/.dot', '**/[.]dot'));
    });

    it('should match a dot when the dot is explicitly defined', function() {
      assert(nm.isMatch('/.dot', '**/.[d]ot'));
      assert(nm.isMatch('/.dot', '**/.dot*'));
      assert(nm.isMatch('a/.dot', '*/.[d]ot'));
      assert(nm.isMatch('a/.dot', '*/.dot*'));
      assert(nm.isMatch('a/b/.dot', '**/.[d]ot'));
      assert(nm.isMatch('a/b/.dot', '**/.dot*'));
    });
  });

  describe('options.dot', function() {
    it('should match dotfiles when `options.dot` is true', function() {
      assert(nm.isMatch('.dot', '*dot', {dot: true}));
      assert(nm.isMatch('.dot', '[.]dot', {dot: true}));
      assert(nm.isMatch('.dot', '?dot', {dot: true}));

      assert(nm.isMatch('a/b/.dot', '*dot', {dot: true, matchBase: true}));
      assert(nm.isMatch('a/b/.dot', '[.]dot', {dot: true, matchBase: true}));
      assert(nm.isMatch('a/b/.dot', '?dot', {dot: true, matchBase: true}));

      assert(nm.isMatch('a/b/.dot', '**/*dot', {dot: true}));
      assert(nm.isMatch('a/b/.dot', '**/.[d]ot', {dot: true}));
      assert(nm.isMatch('a/b/.dot', '**/[.]dot', {dot: true}));
      assert(nm.isMatch('a/b/.dot', '**/?dot', {dot: true}));
    });

    it('should not match dotfiles when `options.dot` is false', function() {
      assert(nm.isMatch('a/b/.dot', '[.]dot', {dot: false, matchBase: true}));
      assert(nm.isMatch('a/b/.dot', '**/[.]dot', {dot: false}));

      assert(!nm.isMatch('a/b/.dot', '*dot', {dot: false, matchBase: true}));
      assert(!nm.isMatch('a/b/.dot', '?dot', {dot: false, matchBase: true}));

      assert(!nm.isMatch('a/b/.dot', '**/*dot', {dot: false}));
      assert(!nm.isMatch('a/b/.dot', '**/?dot', {dot: false}));
    });

    it('should not match dotfiles when `options.dot` is not defined', function() {
      assert(nm.isMatch('a/b/.dot', '.dot', {matchBase: true}));
      assert(nm.isMatch('a/b/.dot', '[.]dot', {matchBase: true}));
      assert(nm.isMatch('a/b/.dot', '**/[.]dot'));

      assert(!nm.isMatch('a/b/.dot', '*dot', {matchBase: true}));
      assert(!nm.isMatch('a/b/.dot', '?dot', {matchBase: true}));

      assert(!nm.isMatch('a/b/.dot', '**/*dot'));
      assert(!nm.isMatch('a/b/.dot', '**/?dot'));
    });
  });
});
