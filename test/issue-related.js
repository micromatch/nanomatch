'use strict';

var assert = require('assert');
var argv = require('yargs-parser')(process.argv.slice(2));
var matcher = argv.mm ? require('minimatch') : require('..');
var isMatch = argv.mm ? matcher : matcher.isMatch;

describe('issue-related tests', function() {
  // see https://github.com/jonschlinkert/micromatch/issues/15
  it('issue #15', function() {
    assert(isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
  });

  // see https://github.com/jonschlinkert/micromatch/issues/23
  it('issue #23', function() {
    assert(!isMatch('zzjs', 'z*.js'));
    assert(!isMatch('zzjs', '*z.js'));
  });

  // see https://github.com/jonschlinkert/micromatch/issues/24
  it('issue #24', function() {
    assert(!isMatch('a', 'a/**'));
    assert(!isMatch('a/b/c/d/', 'a/b/**/f'));
    assert(isMatch('a', '**'));
    assert(isMatch('a/', '**'));
    assert(isMatch('a/b/c/d', '**'));
    assert(isMatch('a/b/c/d/', '**'));
    assert(isMatch('a/b/c/d/', '**/**'));
    assert(isMatch('a/b/c/d/', '**/b/**'));
    assert(isMatch('a/b/c/d/', 'a/b/**'));
    assert(isMatch('a/b/c/d/', 'a/b/**/'));
    assert(isMatch('a/b/c/d/e.f', 'a/b/**/**/*.*'));
    assert(isMatch('a/b/c/d/e.f', 'a/b/**/*.*'));
    assert(isMatch('a/b/c/d/g/e.f', 'a/b/**/d/**/*.*'));
    assert(isMatch('a/b/c/d/g/g/e.f', 'a/b/**/d/**/*.*'));
  });

  // see https://github.com/jonschlinkert/micromatch/issues/63
  it('issue #63', function() {
    assert(isMatch('a/b-c/d/e/z.js', 'a/b-*/**/z.js'));
    assert(!isMatch('/aaa/bbb/.git', '/aaa/bbb/**')); // => true; should be false
    assert(!isMatch('aaa/bbb/.git', 'aaa/bbb/**')); // => true; should be false
    assert(!isMatch('/aaa/bbb/ccc/.git', '/aaa/bbb/**')); // => false; correct
  });
});
