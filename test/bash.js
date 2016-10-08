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
 * be either `nanomatch` or `minimatch` (if the `--mm` flag is passed)
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
      nm(fixtures, 'a\\*', {nonull: true, unescape: true}, ['a\\*']);
      nm(fixtures, 'a\\*', []);

      nm(fixtures, ['a\\*', '\\*'], {nonull: true}, ['a\\*', '*', '\\*']);
      nm(fixtures, ['a\\*', '\\*'], {nonull: true, unescape: true}, ['a\\*', '*', '\\*']);
      nm(fixtures, ['a\\*', '\\*'], {unescape: true}, ['*', '\\*']);
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

    it('Make sure character classes work properly:', function() {
      nm(fixtures, '[a-y]*[^c]', ['abd', 'abe', 'bb', 'bcd', 'ca', 'cb', 'dd', 'de', 'bdir/']);
      nm(fixtures, 'a*[^c]', ['abd', 'abe']);

      nm(['a-b', 'aXb'], 'a[X-]b', ['a-b', 'aXb']);
      nm(fixtures, '[^a-c]*', ['d', 'dd', 'de', 'Beware', '*', '\\*']);
      nm(['a*b/ooo'], 'a\\*b/*', ['a*b/ooo']);
      nm(['a*b/ooo'], 'a\\*?/*', ['a*b/ooo']);
      nm(fixtures, 'a[b]c', ['abc']);
      nm(fixtures, 'a["b"]c', ['abc']);
      nm(fixtures, 'a[\\b]c', ['abc']);
      nm(fixtures, 'a?c', ['abc']);
      nm(['man/man1/bash.1'], '*/man*/bash.*', ['man/man1/bash.1']);
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

    it('Test recursion and the abort code', function() {
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
