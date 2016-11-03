'use strict';

var assert = require('assert');
var nm = require('./support/match');

describe('qmarks and stars', function() {
  it('should correctly handle question marks in globs', function() {
    nm(['?'], '?', ['?']);
    nm(['aaa', 'aac', 'abc'], 'a?c', ['abc', 'aac']);
    nm(['aaa', 'aac', 'abc'], 'a*?c', ['aac', 'abc']);
    nm(['a', 'aa', 'ab', 'ab?', 'ac', 'ac?', 'abcd', 'abbb'], 'ab?', ['ab?']);
    nm(['abc', 'abb', 'acc'], 'a**?c', ['abc', 'acc']);
    nm(['abc'], 'a*****?c', ['abc']);
    nm(['abc', 'zzz', 'bbb'], '?*****??', ['abc', 'zzz', 'bbb']);
    nm(['abc', 'zzz', 'bbb'], '*****??', ['abc', 'zzz', 'bbb']);
    nm(['abc', 'abb', 'zzz'], '?*****?c', ['abc']);
    nm(['abc', 'bbb', 'zzz'], '?***?****c', ['abc']);
    nm(['abc', 'bbb', 'zzz'], '?***?****?', ['abc', 'bbb', 'zzz']);
    nm(['abc'], '?***?****', ['abc']);
    nm(['abc'], '*******c', ['abc']);
    nm(['abc'], '*******?', ['abc']);
    nm(['abcdecdhjk'], 'a*cd**?**??k', ['abcdecdhjk']);
    nm(['abcdecdhjk'], 'a**?**cd**?**??k', ['abcdecdhjk']);
    nm(['abcdecdhjk'], 'a**?**cd**?**??k***', ['abcdecdhjk']);
    nm(['abcdecdhjk'], 'a**?**cd**?**??***k', ['abcdecdhjk']);
    nm(['abcdecdhjk'], 'a**?**cd**?**??***k**', ['abcdecdhjk']);
    nm(['abcdecdhjk'], 'a****c**?**??*****', ['abcdecdhjk']);
  });

  it('should match one character per question mark', function() {
    nm(['a/b/c.md'], 'a/?/c.md', ['a/b/c.md']);
    nm(['a/bb/c.md'], 'a/?/c.md', []);
    nm(['a/bb/c.md'], 'a/??/c.md', ['a/bb/c.md']);
    nm(['a/bbb/c.md'], 'a/??/c.md', []);
    nm(['a/bbb/c.md'], 'a/???/c.md', ['a/bbb/c.md']);
    nm(['a/bbbb/c.md'], 'a/????/c.md', ['a/bbbb/c.md']);
  });

  it('should match multiple groups of question marks', function() {
    nm(['a/bb/c/dd/e.md'], 'a/?/c/?/e.md', []);
    nm(['a/b/c/d/e.md'], 'a/?/c/?/e.md', ['a/b/c/d/e.md']);
    nm(['a/b/c/d/e.md'], 'a/?/c/???/e.md', []);
    nm(['a/b/c/zzz/e.md'], 'a/?/c/???/e.md', ['a/b/c/zzz/e.md']);
  });

  it('should use qmarks with other special characters', function() {
    nm(['a/b/c/d/e.md'], 'a/?/c/?/*/e.md', []);
    nm(['a/b/c/d/e/e.md'], 'a/?/c/?/*/e.md', ['a/b/c/d/e/e.md']);
    nm(['a/b/c/d/efghijk/e.md'], 'a/?/c/?/*/e.md', ['a/b/c/d/efghijk/e.md']);
    nm(['a/b/c/d/efghijk/e.md'], 'a/?/**/e.md', ['a/b/c/d/efghijk/e.md']);
    nm(['a/bb/e.md'], 'a/?/e.md', []);
    nm(['a/bb/e.md'], 'a/?/**/e.md', []);
    nm(['a/b/c/d/efghijk/e.md'], 'a/*/?/**/e.md', ['a/b/c/d/efghijk/e.md']);
    nm(['a/b/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md', ['a/b/c/d/efgh.ijk/e.md']);
    nm(['a/b.bb/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md', ['a/b.bb/c/d/efgh.ijk/e.md']);
    nm(['a/bbb/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md', ['a/bbb/c/d/efgh.ijk/e.md']);
  });

  it('question marks should not match slashes', function() {
    assert(!nm.isMatch('aaa/bbb', 'aaa?bbb'));
    assert(!nm.isMatch('aaa//bbb', 'aaa?bbb'));
    assert(!nm.isMatch('aaa\\bbb', 'aaa?bbb'));
    assert(!nm.isMatch('aaa\\\\bbb', 'aaa?bbb'));
  });

  it('question marks should not match dots', function() {
    assert(!nm.isMatch('aaa.bbb', 'aaa?bbb'));
    assert(!nm.isMatch('aaa/.bbb', 'aaa/?bbb'));
  });

  it('question marks should match characters preceding a dot', function() {
    assert(nm.isMatch('a/bbb/abcd.md', 'a/*/ab??.md'));
    assert(nm.isMatch('a/bbb/abcd.md', 'a/bbb/ab??.md'));
    assert(nm.isMatch('a/bbb/abcd.md', 'a/bbb/ab???md'));
  });
});
