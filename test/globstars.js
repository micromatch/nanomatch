'use strict';

var assert = require('assert');
var argv = require('yargs-parser')(process.argv.slice(2));
var mm = require('..');
var matcher = argv.mm ? require('minimatch') : mm;

function match(arr, pattern, expected, options) {
  var actual = matcher.match(arr, pattern, options);
  assert.deepEqual(actual.sort(), expected.sort());
}

describe('globstars', function() {
  it('should support globstars (**)', function() {
    var fixture = ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];
    match(fixture, '**', fixture);
    match(fixture, 'a/**', fixture);
    match(fixture, 'a/**/*', fixture);
    match(fixture, 'a/**/**/*', fixture);
    match(fixture, 'b/**', []);
    match(fixture, '**/x/**', ['a/x/y', 'a/x/y/z']);
    match(fixture, '**/x/*', ['a/x/y']);
    match(fixture, '**/x/*/*', ['a/x/y/z']);
    match(fixture, '**/**/x', ['a/x']);
    match(fixture, '**/x', ['a/x']);

    assert(!mm.isMatch('.gitignore', 'a/**/z/*.md'));
    assert(!mm.isMatch('a/b/c/d/e/z/foo.md', 'a/**/j/**/z/*.md'));
    assert(!mm.isMatch('a/b/c/j/e/z/foo.txt', 'a/**/j/**/z/*.md'));
    assert(!mm.isMatch('a/b/z/.dotfile', 'a/**/z/*.md'));
    assert(!mm.isMatch('a/b/z/.dotfile.md', '**/c/.*.md'));

    assert(mm.isMatch('a/b/c/d/e/j/n/p/o/z/foo.md', 'a/**/j/**/z/*.md'));
    assert(mm.isMatch('a/b/c/d/e/z/foo.md', 'a/**/z/*.md'));
    assert(mm.isMatch('a/b/c/j/e/z/foo.md', 'a/**/j/**/z/*.md'));
    assert(mm.isMatch('a/b/z/.dotfile.md', '**/.*.md'));
    assert(mm.isMatch('a/b/z/.dotfile.md', 'a/**/z/.*.md'));
  });

  it('should match file extensions:', function() {
    match(['.md', 'a.md', 'a/b/c.md', '.txt'], '**/*.md', ['a.md', 'a/b/c.md']);
    match(['.md', 'a/b/.md'], '**/.md', ['.md', 'a/b/.md']);
  });

  it('should respect trailing slashes on paterns', function() {
    var fixture = ['a', 'a/', 'b', 'b/', 'a/a', 'a/a/', 'a/b', 'a/b/', 'a/c', 'a/c/', 'a/x', 'a/x/', 'a/a/a', 'a/a/b', 'a/a/b/', 'a/a/a/', 'a/a/a/a', 'a/a/a/a/', 'a/a/a/a/a', 'a/a/a/a/a/', 'x/y', 'z/z', 'x/y/', 'z/z/', 'a/b/c/.d/e/'];
    match(fixture, '**/*/a/', ['a/a/', 'a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
    match(fixture, '**/*/a/*/', ['a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/', 'a/a/b/']);
    match(fixture, '**/*/x/', ['a/x/']);
    match(fixture, '**/*/*/*/*/', ['a/a/a/a/', 'a/a/a/a/a/']);
    match(fixture, '**/*/*/*/*/*/', ['a/a/a/a/a/']);
    match(fixture, '*a/a/*/', ['a/a/a/', 'a/a/b/']);
    match(fixture, '**a/a/*/', ['a/a/a/', 'a/a/b/']);
    match(fixture, '**/a/*/*/', ['a/a/a/', 'a/a/b/', 'a/a/a/a/', 'a/a/a/a/a/']);
    match(fixture, '**/a/*/*/*/', ['a/a/a/a/', 'a/a/a/a/a/']);
    match(fixture, '**/a/*/*/*/*/', ['a/a/a/a/a/']);
    match(fixture, '**/a/*/a/', ['a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
    match(fixture, '**/a/*/b/', ['a/a/b/']);
  });

  it('should match literal globstars when escaped', function() {
    match(['.md', '**a.md', '**.md', '.md', '**'], '\\*\\**.md', ['**a.md', '**.md']);
    match(['.md', '**a.md', '**.md', '.md', '**'], '\\*\\*.md', ['**.md']);
  });
});
