'use strict';

var assert = require('assert');
var argv = require('yargs-parser')(process.argv.slice(2));
var mm = require('..');
var matcher = argv.mm ? require('multimatch') : mm;

function match(arr, pattern, expected, options) {
  var actual = matcher(arr, pattern, options);
  assert.deepEqual(actual.sort(), expected.sort());
}

describe('globstars', function() {
  it('should match double star patterns', function() {
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

  it('should match extensions:', function() {
    match(['.md', 'a.md', 'a/b/c.md', '.txt'], '**/*.md', ['a.md', 'a/b/c.md']);
    match(['.md', 'a/b/.md'], '**/.md', ['.md', 'a/b/.md']);
  });
});
