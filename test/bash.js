/*!
 * nanomatch <https://github.com/jonschlinkert/nanomatch>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

require('mocha');
var assert = require('assert');
var nm = require('./support/match');

/**
 * Heads up! In these tests, `nm` is a custom function that can
 * be either `nanomatch` or `minimatch` if the `--nm` flag is passed
 */

// from the Bash 4.3 specification/unit tests
var fixtures = ['a', 'b', 'c', 'd', 'abc', 'abd', 'abe', 'bb', 'bcd', 'ca', 'cb', 'dd', 'de', 'Beware', 'bdir/', '*', '\\*'];

describe('bash options and features:', function() {
  describe('failglob:', function() {
    it('should throw an error when no matches are found:', function() {
      assert.throws(function() {
        require('..').match(fixtures, '\\^', {failglob: true});
      }, /no matches found for/);
    });
  });

  // $echo a/{1..3}/b
  describe('bash', function() {
    it('should handle "regular globbing":', function() {
      nm(fixtures, 'a*', ['a', 'abc', 'abd', 'abe']);
      nm(fixtures, '\\a*', ['a', 'abc', 'abd', 'abe']);
    });

    it('should match directories:', function() {
      nm(fixtures, 'b*/', ['bdir/']);
    });

    it('should use quoted characters as literals:', function() {
      nm(fixtures, '\\*', {nonull: true}, ['*', '\\*']);
      nm(fixtures, '\\^', {nonull: true}, ['\\^']);
      nm(fixtures, '\\^', []);

      nm(fixtures, 'a\\*', {nonull: true}, ['a\\*']);
      nm(fixtures, 'a\\*', ['a*'], {nonull: true, unescape: true});
      nm(fixtures, 'a\\*', []);

      nm(fixtures, ['a\\*', '\\*'], {nonull: true}, ['a\\*', '*', '\\*']);
      nm(fixtures, ['a\\*', '\\*'], {nonull: true, unescape: true}, ['a*', '*']);
      nm(fixtures, ['a\\*', '\\*'], {unescape: true}, ['*']);
      nm(fixtures, ['a\\*', '\\*'], ['*', '\\*']);

      nm(fixtures, ['a\\*'], {nonull: true}, ['a\\*']);
      nm(fixtures, ['a\\*'], []);

      nm(fixtures, ['c*', 'a\\*', '*q*'], {nonull: true}, ['c', 'ca', 'cb', 'a\\*', '*q*']);
      nm(fixtures, ['c*', 'a\\*', '*q*'], ['c', 'ca', 'cb']);

      nm(fixtures, '"*"*', {nonull: true}, ['"*"*']);
      nm(fixtures, '"*"*', []);

      nm(fixtures, '\\**', ['*']); // `*` is in the fixtures array
    });

    it('should work for escaped paths/dots:', function() {
      nm(fixtures, '"\\.\\./*/"', {nonull: true}, ['"\\.\\./*/"']);
      nm(fixtures, '"\\.\\./*/"', {nonull: true, unescape: true}, ['"../*/"']);
      nm(fixtures, 's/\\..*//', {nonull: true}, ['s/\\..*//']);
    });

    it('Pattern from Larry Wall\'s Configure that caused bash to blow up:', function() {
      nm(fixtures, '"/^root:/{s/^[^:]*:[^:]*:\\([^:]*\\).*"\'$\'"/\\1/"', {nonull: true}, ['"/^root:/{s/^[^:]*:[^:]*:\\([^:]*\\).*"\'$\'"/\\1/"']);
      nm(fixtures, '[a-c]b*', ['abc', 'abd', 'abe', 'bb', 'cb']);
    });

    it('should support character classes', function() {
      var f = fixtures.slice();
      f.push('baz', 'bzz', 'BZZ', 'beware', 'BewAre');
      nm(f, '[a-y]*[^c]', ['abd', 'abe', 'baz', 'beware', 'bzz', 'bb', 'bcd', 'ca', 'cb', 'dd', 'de', 'bdir/']);
      nm(f, 'a*[^c]', ['abd', 'abe']);
      nm(['a-b', 'aXb'], 'a[X-]b', ['a-b', 'aXb']);
      nm(f, '[^a-c]*', ['d', 'dd', 'de', 'BewAre', 'BZZ', '*', '\\*']);
      nm(['a*b/ooo'], 'a\\*b/*', ['a*b/ooo']);
      nm(['a*b/ooo'], 'a\\*?/*', ['a*b/ooo']);
      nm(f, 'a[b]c', ['abc']);
      nm(f, 'a["b"]c', ['abc']);
      nm(f, 'a[\\\\b]c', ['abc']);
      nm(f, 'a[\\b]c', ['abc']);
      nm(f, 'a?c', ['abc']);
      nm(['a-b'], 'a[]-]b', ['a-b']);
      nm(['man/man1/bash.1'], '*/man*/bash.*', ['man/man1/bash.1']);
    });

    it('should support basic wildmatch (brackets) features', function() {
      assert(!nm.isMatch('aab', 'a[]-]b'));
      assert(!nm.isMatch('ten', '[ten]'));
      assert(!nm.isMatch('ten', 't[!a-g]n'));
      assert(nm.isMatch(']', ']'));
      assert(nm.isMatch('a-b', 'a[]-]b'));
      assert(nm.isMatch('a]b', 'a[]-]b'));
      assert(nm.isMatch('a]b', 'a[]]b'));
      assert(nm.isMatch('aab', 'a[\\]a\\-]b'));
      assert(nm.isMatch('ten', 't[a-g]n'));
      assert(nm.isMatch('ton', 't[!a-g]n'));
      assert(nm.isMatch('ton', 't[^a-g]n'));
    });

    it('should support Extended slash-matching features', function() {
      assert(!nm.isMatch('foo/bar', 'f[^eiu][^eiu][^eiu][^eiu][^eiu]r'));
      assert(nm.isMatch('foo/bar', 'foo[/]bar'));
      assert(nm.isMatch('foo-bar', 'f[^eiu][^eiu][^eiu][^eiu][^eiu]r'));
    });

    it('should match braces', function() {
      assert(nm.isMatch('foo{}baz', 'foo[{a,b}]+baz'));
    });

    it('should match parens', function() {
      assert(nm.isMatch('foo(bar)baz', 'foo[bar()]+baz'));
    });

    it('should match escaped characters', function() {
      assert(!nm.isMatch('', '\\'));
      assert(!nm.isMatch('XXX/\\', '[A-Z]+/\\'));
      assert(nm.isMatch('\\', '\\'));
      assert(nm.isMatch('XXX/\\', '[A-Z]+/\\\\'));
      assert(nm.isMatch('[ab]', '\\[ab]'));
      assert(nm.isMatch('[ab]', '[\\[:]ab]'));
    });

    it('should match brackets', function() {
      assert(!nm.isMatch(']', '[!]-]'));
      assert(nm.isMatch('a', '[!]-]'));
      assert(nm.isMatch('[ab]', '[[]ab]'));
    });

    it('tests with multiple `*\'s:', function() {
      nm(['bbc', 'abc', 'bbd'], 'a**c', ['abc']);
      nm(['bbc', 'abc', 'bbd'], 'a***c', ['abc']);
      nm(['bbc', 'abc', 'bbc'], 'a*****?c', ['abc']);
      nm(['bbc', 'abc'], '?*****??', ['bbc', 'abc']);
      nm(['bbc', 'abc'], '*****??', ['bbc', 'abc']);
      nm(['bbc', 'abc'], '?*****?c', ['bbc', 'abc']);
      nm(['bbc', 'abc', 'bbd'], '?***?****c', ['bbc', 'abc']);
      nm(['bbc', 'abc'], '?***?****?', ['bbc', 'abc']);
      nm(['bbc', 'abc'], '?***?****', ['bbc', 'abc']);
      nm(['bbc', 'abc'], '*******c', ['bbc', 'abc']);
      nm(['bbc', 'abc'], '*******?', ['bbc', 'abc']);
      nm(['abcdecdhjk'], 'a*cd**?**??k', ['abcdecdhjk']);
      nm(['abcdecdhjk'], 'a**?**cd**?**??k', ['abcdecdhjk']);
      nm(['abcdecdhjk'], 'a**?**cd**?**??k***', ['abcdecdhjk']);
      nm(['abcdecdhjk'], 'a**?**cd**?**??***k', ['abcdecdhjk']);
      nm(['abcdecdhjk'], 'a**?**cd**?**??***k**', ['abcdecdhjk']);
      nm(['abcdecdhjk'], 'a****c**?**??*****', ['abcdecdhjk']);
    });

    it('none of these should output anything:', function() {
      nm(['abc'], '??**********?****?', []);
      nm(['abc'], '??**********?****c', []);
      nm(['abc'], '?************c****?****', []);
      nm(['abc'], '*c*?**', []);
      nm(['abc'], 'a*****c*?**', []);
      nm(['abc'], 'a********???*******', []);
      nm(['a'], '[]', []);
      nm(['['], '[abc', []);
    });
  });

  describe('wildmat', function() {
    it('Basic wildmat features', function() {
      assert(!nm.isMatch('foo', '*f'));
      assert(!nm.isMatch('foo', '??'));
      assert(!nm.isMatch('foo', 'bar'));
      assert(!nm.isMatch('foobar', 'foo\\*bar'));
      assert(nm.isMatch('', ''));
      assert(nm.isMatch('?a?b', '\\??\\?b'));
      assert(nm.isMatch('aaaaaaabababab', '*ab'));
      assert(nm.isMatch('f\\oo', 'f\\oo'));
      assert(nm.isMatch('foo', '*'));
      assert(nm.isMatch('foo', '*foo*'));
      assert(nm.isMatch('foo', '???'));
      assert(nm.isMatch('foo', 'f*'));
      assert(nm.isMatch('foo', 'foo'));
      assert(nm.isMatch('foo*', 'foo\\*', {unixify: false}));
      assert(nm.isMatch('foobar', '*ob*a*r*'));
    });

    it('should support recursion', function() {
      assert(!nm.isMatch('-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
      assert(!nm.isMatch('-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
      assert(!nm.isMatch('ab/cXd/efXg/hi', '*X*i'));
      assert(!nm.isMatch('ab/cXd/efXg/hi', '*Xg*i'));
      assert(!nm.isMatch('abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz', '**/*a*b*g*n*t'));
      assert(!nm.isMatch('foo', '*/*/*'));
      assert(!nm.isMatch('foo', 'fo'));
      assert(!nm.isMatch('foo/bar', '*/*/*'));
      assert(!nm.isMatch('foo/bar', 'foo?bar'));
      assert(!nm.isMatch('foo/bb/aa/rr', '*/*/*'));
      assert(!nm.isMatch('foo/bba/arr', 'foo*'));
      assert(!nm.isMatch('foo/bba/arr', 'foo**'));
      assert(!nm.isMatch('foo/bba/arr', 'foo/*'));
      assert(!nm.isMatch('foo/bba/arr', 'foo/**arr'));
      assert(!nm.isMatch('foo/bba/arr', 'foo/**z'));
      assert(!nm.isMatch('foo/bba/arr', 'foo/*arr'));
      assert(!nm.isMatch('foo/bba/arr', 'foo/*z'));
      assert(!nm.isMatch('XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*'));
      assert(nm.isMatch('-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1', '-*-*-*-*-*-*-12-*-*-*-m-*-*-*'));
      assert(nm.isMatch('ab/cXd/efXg/hi', '**/*X*/**/*i'));
      assert(nm.isMatch('ab/cXd/efXg/hi', '*/*X*/*/*i'));
      assert(nm.isMatch('abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt', '**/*a*b*g*n*t'));
      assert(nm.isMatch('abcXdefXghi', '*X*i'));
      assert(nm.isMatch('foo', 'foo'));
      assert(nm.isMatch('foo/bar', 'foo/*'));
      assert(nm.isMatch('foo/bar', 'foo/bar'));
      assert(nm.isMatch('foo/bar', 'foo[/]bar'));
      assert(nm.isMatch('foo/bb/aa/rr', '**/**/**'));
      assert(nm.isMatch('foo/bba/arr', '*/*/*'));
      assert(nm.isMatch('foo/bba/arr', 'foo/**'));
      assert(nm.isMatch('XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1', 'XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*', {unixify: false}));
    });
  });
});
