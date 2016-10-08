'use strict';

var assert = require('assert');
var match = require('./support/match');
var nm = require('..');

describe('globstars', function() {
  it('should support globstars (**)', function() {
    var fixtures = ['.a/a', 'a/a', 'a/.a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z', 'a/../a', 'ab/../ac', '../a', 'a', '../../b', '../c', '../c/d'];

    match(fixtures, '**', ['a', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    match(fixtures, '**/**', ['a', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    match(fixtures, '**/', []);
    match(fixtures, '**/**/*', ['a', 'a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    match(fixtures, '**/**/x', ['a/x']);
    match(fixtures, '**/x', ['a/x']);
    match(fixtures, '**/x/*', ['a/x/y']);
    match(fixtures, '*/x/**', ['a/x/y', 'a/x/y/z']);
    match(fixtures, '**/x/**', ['a/x/y', 'a/x/y/z']);
    match(fixtures, '**/x/*/*', ['a/x/y/z']);
    match(fixtures, 'a/**', ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    match(fixtures, 'a/**/*', ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    match(fixtures, 'a/**/**/*', ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z']);
    match(fixtures, 'b/**', []);
  });

  it('should support multiple globstars in one pattern', function() {
    assert(!nm.isMatch('a/b/c/d/e/z/foo.md', 'a/**/j/**/z/*.md'));
    assert(!nm.isMatch('a/b/c/j/e/z/foo.txt', 'a/**/j/**/z/*.md'));
    assert(nm.isMatch('a/b/c/d/e/j/n/p/o/z/foo.md', 'a/**/j/**/z/*.md'));
    assert(nm.isMatch('a/b/c/d/e/z/foo.md', 'a/**/z/*.md'));
    assert(nm.isMatch('a/b/c/j/e/z/foo.md', 'a/**/j/**/z/*.md'));
  });

  it('should match dotfiles', function() {
    var fixtures = ['.gitignore', 'a/b/z/.dotfile', 'a/b/z/.dotfile.md', 'a/b/z/.dotfile.md', 'a/b/z/.dotfile.md'];
    assert(!nm.isMatch('.gitignore', 'a/**/z/*.md'));
    assert(!nm.isMatch('a/b/z/.dotfile', 'a/**/z/*.md'));
    assert(!nm.isMatch('a/b/z/.dotfile.md', '**/c/.*.md'));
    assert(nm.isMatch('a/b/z/.dotfile.md', '**/.*.md'));
    assert(nm.isMatch('a/b/z/.dotfile.md', 'a/**/z/.*.md'));
    assert.deepEqual(nm.match(fixtures, 'a/**/z/.*.md'), [ 'a/b/z/.dotfile.md' ]);
  });

  it('should match file extensions:', function() {
    match(['.md', 'a.md', 'a/b/c.md', '.txt'], '**/*.md', ['a.md', 'a/b/c.md']);
    match(['.md', 'a/b/.md'], '**/.md', ['.md', 'a/b/.md']);
  });

  it('should respect trailing slashes on paterns', function() {
    var fixtures = ['a', 'a/', 'b', 'b/', 'a/a', 'a/a/', 'a/b', 'a/b/', 'a/c', 'a/c/', 'a/x', 'a/x/', 'a/a/a', 'a/a/b', 'a/a/b/', 'a/a/a/', 'a/a/a/a', 'a/a/a/a/', 'a/a/a/a/a', 'a/a/a/a/a/', 'x/y', 'z/z', 'x/y/', 'z/z/', 'a/b/c/.d/e/'];
    match(fixtures, '**/*/a/', ['a/a/', 'a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
    match(fixtures, '**/*/a/*/', ['a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/', 'a/a/b/']);
    match(fixtures, '**/*/x/', ['a/x/']);
    match(fixtures, '**/*/*/*/*/', ['a/a/a/a/', 'a/a/a/a/a/']);
    match(fixtures, '**/*/*/*/*/*/', ['a/a/a/a/a/']);
    match(fixtures, '*a/a/*/', ['a/a/a/', 'a/a/b/']);
    match(fixtures, '**a/a/*/', ['a/a/a/', 'a/a/b/']);
    match(fixtures, '**/a/*/*/', ['a/a/a/', 'a/a/b/', 'a/a/a/a/', 'a/a/a/a/a/']);
    match(fixtures, '**/a/*/*/*/', ['a/a/a/a/', 'a/a/a/a/a/']);
    match(fixtures, '**/a/*/*/*/*/', ['a/a/a/a/a/']);
    match(fixtures, '**/a/*/a/', ['a/a/a/', 'a/a/a/a/', 'a/a/a/a/a/']);
    match(fixtures, '**/a/*/b/', ['a/a/b/']);
  });

  it('should match literal globstars when escaped', function() {
    var fixtures = ['.md', '**a.md', '**.md', '.md', '**'];
    match(fixtures, '\\*\\**.md', ['**a.md', '**.md']);
    match(fixtures, '\\*\\*.md', ['**.md']);
  });

  // related to https://github.com/isaacs/minimatch/issues/67
  it('should work consistently with `makeRe` and matcher functions', function() {
    var re = nm.makeRe('node_modules/foobar/**/*.bar');
    assert(re.test('node_modules/foobar/foo.bar'));
    assert(nm.isMatch('node_modules/foobar/foo.bar', 'node_modules/foobar/**/*.bar'));
    match(['node_modules/foobar/foo.bar'], 'node_modules/foobar/**/*.bar', ['node_modules/foobar/foo.bar']);
  });
});
