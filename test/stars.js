'use strict';

var assert = require('assert');
var argv = require('yargs-parser')(process.argv.slice(2));
var mm = require('..');
var matcher = argv.mm ? require('multimatch') : mm;

function match(arr, pattern, expected, options) {
  var actual = matcher(arr, pattern, options);
  assert.deepEqual(actual.sort(), expected.sort());
}

describe('stars', function() {
  it('should match one directory level with a single star (*)', function() {
    var fixture = ['a', 'b', 'a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a', 'x/y', 'z/z'];
    match(fixture, '*', ['a', 'b']);
    match(fixture, '*/*', ['a/a', 'a/b', 'a/c', 'a/x', 'x/y', 'z/z']);
    match(fixture, '*/*/*', ['a/a/a', 'a/a/b']);
    match(fixture, '*/*/*/*', ['a/a/a/a']);
    match(fixture, '*/*/*/*/*', ['a/a/a/a/a']);
    match(fixture, 'a/*', ['a/a', 'a/b', 'a/c', 'a/x']);
    match(fixture, 'a/*/*', ['a/a/a', 'a/a/b']);
    match(fixture, 'a/*/*/*', ['a/a/a/a']);
    match(fixture, 'a/*/*/*/*', ['a/a/a/a/a']);
    match(fixture, 'a/*/a', ['a/a/a']);
    match(fixture, 'a/*/b', ['a/a/b']);
  });

  it('should match one or more characters', function() {
    var fixture = ['a', 'aa', 'aaa', 'aaaa', 'ab', 'b', 'bb', 'c', 'cc', 'cac', 'a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a', 'x/y', 'z/z'];
    match(fixture, '*', ['a', 'aa', 'aaa', 'aaaa', 'ab', 'b', 'bb', 'c', 'cc', 'cac']);
    match(fixture, 'a*', ['a', 'aa', 'aaa', 'aaaa', 'ab']);
    match(fixture, '*b', ['ab', 'b', 'bb']);
  });

  it('should match one or zero characters', function() {
    var fixture = ['a', 'aa', 'aaa', 'aaaa', 'ab', 'b', 'bb', 'c', 'cc', 'cac', 'a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a', 'x/y', 'z/z'];
    match(fixture, '*', ['a', 'aa', 'aaa', 'aaaa', 'ab', 'b', 'bb', 'c', 'cc', 'cac']);
    match(fixture, '*a*', ['a', 'aa', 'aaa', 'aaaa', 'ab', 'cac']);
    match(fixture, '*b*', ['ab', 'b', 'bb']);
    match(fixture, '*c*', ['c', 'cc', 'cac']);
  });

  it('should respect trailing slashes on paterns', function() {
    var fixture = ['a', 'a/', 'b', 'b/', 'a/a', 'a/a/', 'a/b', 'a/b/', 'a/c', 'a/c/', 'a/x', 'a/x/', 'a/a/a', 'a/a/b', 'a/a/b/', 'a/a/a/', 'a/a/a/a', 'a/a/a/a/', 'a/a/a/a/a', 'a/a/a/a/a/', 'x/y', 'z/z', 'x/y/', 'z/z/', 'a/b/c/.d/e/'];
    match(fixture, '*/', ['a/', 'b/']);
    match(fixture, '*/*/', ['a/a/', 'a/b/', 'a/c/', 'a/x/', 'x/y/', 'z/z/']);
    match(fixture, '*/*/*/', ['a/a/a/', 'a/a/b/']);
    match(fixture, '*/*/*/*/', ['a/a/a/a/']);
    match(fixture, '*/*/*/*/*/', ['a/a/a/a/a/']);
    match(fixture, 'a/*/', ['a/a/', 'a/b/', 'a/c/', 'a/x/']);
    match(fixture, 'a/*/*/', ['a/a/a/', 'a/a/b/']);
    match(fixture, 'a/*/*/*/', ['a/a/a/a/']);
    match(fixture, 'a/*/*/*/*/', ['a/a/a/a/a/']);
    match(fixture, 'a/*/a/', ['a/a/a/']);
    match(fixture, 'a/*/b/', ['a/a/b/']);
  });

  it('should match a literal star when escaped', function() {
    var fixtures = ['.md', 'a**a.md', '**a.md', '**/a.md', '**.md', '.md', '*', '**', '*.md'];
    match(fixtures, '\\*', ['*']);
    match(fixtures, '\\*.md', ['*.md']);
    match(fixtures, '\\**.md', ['**a.md', '**.md', '*.md']);
    match(fixtures, 'a\\**.md', ['a**a.md']);
  });
});
