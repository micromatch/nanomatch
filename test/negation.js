'use strict';

var path = require('path');
var assert = require('assert');
var del = require('delete');
var bash = require('./support/bash');
var argv = require('yargs-parser')(process.argv.slice(2));
var matcher = argv.mm ? require('minimatch') : require('..');

function match(fixtures, pattern, expected, options) {
  var actual = matcher.match(fixtures, pattern, options).sort(compare);
  expected.sort(compare);
  assert.deepEqual(actual, expected);
}

function compareBash(fixtures, pattern, options) {
  var actual = matcher.match(fixtures, pattern, options).sort(compare);
  var expected = bash(fixtures, pattern, options).sort(compare);
  assert.deepEqual(actual, expected, pattern);
}

function compare(a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}

describe('negation', function() {
  beforeEach(function(cb) {
    del(path.join(__dirname, 'fixtures'), {force: true}, cb);
  });

  it('should negate files with extensions:', function() {
    match(['.md'], '!.md', []);
    match(['a.js', 'b.md', 'c.txt'], '!**/*.md', ['a.js', 'c.txt']);
    match(['a.js', 'b.md', 'c.txt'], '!*.md', ['a.js', 'c.txt']);
    match(['abc.md', 'abc.txt'], '!*.md', ['abc.txt']);
    match(['foo.md'], '!*.md', []);
    match(['foo.md'], '!.md', ['foo.md']);

    compareBash(['a.js', 'b.md', 'c.txt'], '!(**/*.md)');
  });

  it('should only treat leading exclamation as special', function() {
    match(['foo!.md', 'bar.md'], 'foo!.md', ['foo!.md']);
    match(['foo!.md', 'bar.md'], '*.md', ['foo!.md', 'bar.md']);
    match(['foo!.md', 'bar.md'], '*!.md', ['foo!.md']);
    match(['foobar.md'], '*b*.md', ['foobar.md']);
    match(['foo!bar.md', 'foo!.md', '!foo!.md'], '*!*.md', ['foo!bar.md', 'foo!.md', '!foo!.md']);
    match(['foo!bar.md', 'foo!.md', '!foo!.md'], '\\!*!*.md', ['!foo!.md']);
    match(['foo!.md', 'ba!r.js'], '**/*!*.*', ['foo!.md', 'ba!r.js']);
    compare(['foo!bar.md', 'foo!.md', '!foo!.md'], '\\!*!*.md');
    compare(['foo!.md', 'ba!r.js'], '**/*!*.*');
  });

  it('should support negated globs ("*")', function() {
    match(['a.js', 'b.txt', 'c.md'], '!*.md', ['a.js', 'b.txt']);
    match(['a/a/a.js', 'a/b/a.js', 'a/c/a.js'], '!a/*/a.js', []);
    match(['a/a/a/a.js', 'b/a/b/a.js', 'c/a/c/a.js'], '!a/*/*/a.js', ['b/a/b/a.js', 'c/a/c/a.js']);
    match(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/a*.txt', ['a/b.txt', 'a/c.txt']);
    match(['a.a.txt', 'a.b.txt', 'a.c.txt'], '!a.a*.txt', ['a.b.txt', 'a.c.txt']);
    match(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/*.txt', []);
  });

  it('should support negated globstars ("**")', function() {
    match(['a.js', 'b.txt', 'c.md'], '!*.md', ['a.js', 'b.txt']);
    match(['a/a/a.js', 'a/b/a.js', 'a/c/a.js', 'a/a/b.js'], '!**/a.js', ['a/a/b.js']);
    match(['a/a/a/a.js', 'b/a/b/a.js', 'c/a/c/a.js'], '!a/**/a.js', ['b/a/b/a.js', 'c/a/c/a.js']);
    match(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/b.txt', ['a/a.txt', 'a/c.txt']);
    match(['a/b.js', 'a.js', 'a/b.md', 'a.md'], '!**/*.md', ['a/b.js', 'a.js']);
    match(['a/b.js', 'a.js', 'a/b.md', 'a.md'], '**/*.md', ['a/b.md', 'a.md']);
    compare(['a/b.js', 'a.js', 'a/b.md', 'a.md'], '**/*.md');
  });

  it('should negate dotfiles:', function() {
    match(['.dotfile.md'], '!*.md', ['.dotfile.md']);
    match(['.dotfile.txt'], '!*.md', ['.dotfile.txt']);
    match(['.dotfile.txt', 'a/b/.dotfile'], '!*.md', ['.dotfile.txt', 'a/b/.dotfile']);
    match(['.gitignore', 'a', 'b'], '!.gitignore', ['a', 'b']);
  });

  it('should negate files in the immediate directory:', function() {
    match(['a/b.js', 'a.js', 'a/b.md', 'a.md'], '!*.md', ['a/b.js', 'a.js', 'a/b.md']);
  });

  it('should negate files in any directory:', function() {
    match(['a/a.txt', 'a/b.txt', 'a/c.txt'], '!a/b.txt', ['a/a.txt', 'a/c.txt']);
  });
});
