/*!
 * nanomatch <https://github.com/jonschlinkert/nanomatch>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

require('mocha');
var assert = require('assert');
var nm = require('..');

// from the Bash 4.3 specification/unit tests
var fixtures = ['a', 'b', 'c', 'd', 'abc', 'abd', 'abe', 'bb', 'bcd', 'ca', 'cb', 'dd', 'de', 'Beware', 'bdir/', '*', '\\*'];

describe('bash options and features:', function() {
  describe('failglob:', function() {
    it('should throw an error when no matches are found:', function() {
      assert.throws(function() {
        nm.match(fixtures, '\\^', {failglob: true});
      }, /no matches found for/);
    });
  });

  // $echo a/{1..3}/b
  describe('bash', function() {
    it('should handle "regular globbing":', function() {
      assert.deepEqual(nm.match(fixtures, 'a*'), ['a', 'abc', 'abd', 'abe']);
      assert.deepEqual(nm.match(fixtures, '\\a*'), ['a', 'abc', 'abd', 'abe']);
    });

    it('should match directories:', function() {
      assert.deepEqual(nm.match(fixtures, 'b*/'), ['bdir/']);
    });

    it('should use quoted characters as literals:', function() {
      assert.deepEqual(nm.match(fixtures, '\\*', {nonull: true}), ['*', '\\*']);
      assert.deepEqual(nm.match(fixtures, '\\^', {nonull: true}), ['\\^']);
      assert.deepEqual(nm.match(fixtures, '\\^'), []);

      assert.deepEqual(nm.match(fixtures, 'a\\*', {nonull: true}), ['a\\*']);
      assert.deepEqual(nm.match(fixtures, 'a\\*', {nonull: true, unescape: true}), ['a\\*']);
      assert.deepEqual(nm.match(fixtures, 'a\\*'), []);

      assert.deepEqual(nm(fixtures, ['a\\*', '\\*'], {nonull: true}), ['a\\*', '*', '\\*']);
      assert.deepEqual(nm(fixtures, ['a\\*', '\\*'], {nonull: true, unescape: true}), ['a\\*', '*', '\\*']);
      assert.deepEqual(nm(fixtures, ['a\\*', '\\*'], {unescape: true}), ['*', '\\*']);
      assert.deepEqual(nm(fixtures, ['a\\*', '\\*']), ['*', '\\*']);

      assert.deepEqual(nm(fixtures, ['a\\*'], {nonull: true}), ['a\\*']);
      assert.deepEqual(nm(fixtures, ['a\\*']), []);

      assert.deepEqual(nm(fixtures, ['c*', 'a\\*', '*q*'], {nonull: true}), ['c', 'ca', 'cb', 'a\\*', '*q*']);
      assert.deepEqual(nm(fixtures, ['c*', 'a\\*', '*q*']), ['c', 'ca', 'cb']);

      assert.deepEqual(nm.match(fixtures, '"*"*', {nonull: true}), ['"*"*']);
      assert.deepEqual(nm.match(fixtures, '"*"*'), []);

      assert.deepEqual(nm.match(fixtures, '\\**'), ['*']); // `*` is in the fixtures array
    });

    it('should work for escaped paths/dots:', function() {
      assert.deepEqual(nm.match(fixtures, '"\\.\\./*/"', {nonull: true}), ['"\\.\\./*/"']);
      assert.deepEqual(nm.match(fixtures, '"\\.\\./*/"', {nonull: true, unescape: true}), ['"../*/"']);
      assert.deepEqual(nm.match(fixtures, 's/\\..*//', {nonull: true}), ['s/\\..*//']);
    });

    it('Pattern from Larry Wall\'s Configure that caused bash to blow up:', function() {
      assert.deepEqual(nm.match(fixtures, '"/^root:/{s/^[^:]*:[^:]*:\\([^:]*\\).*"\'$\'"/\\1/"', {nonull: true}), ['"/^root:/{s/^[^:]*:[^:]*:\\([^:]*\\).*"\'$\'"/\\1/"']);
      assert.deepEqual(nm.match(fixtures, '[a-c]b*'), ['abc', 'abd', 'abe', 'bb', 'cb']);
    });

    it('Make sure character classes work properly:', function() {
      assert.deepEqual(nm.match(fixtures, '[a-y]*[^c]'), ['abd', 'abe', 'bb', 'bcd', 'ca', 'cb', 'dd', 'de', 'bdir/']);
      assert.deepEqual(nm.match(fixtures, 'a*[^c]'), ['abd', 'abe']);

      assert.deepEqual(nm.match(['a-b', 'aXb'], 'a[X-]b'), ['a-b', 'aXb']);
      assert.deepEqual(nm.match(fixtures, '[^a-c]*'), ['d', 'dd', 'de', 'Beware', '*', '\\*']);
      assert.deepEqual(nm.match(['a*b/ooo'], 'a\\*b/*'), ['a*b/ooo']);
      assert.deepEqual(nm.match(['a*b/ooo'], 'a\\*?/*'), ['a*b/ooo']);
      assert.deepEqual(nm.match(fixtures, 'a[b]c'), ['abc']);
      assert.deepEqual(nm.match(fixtures, 'a["b"]c'), ['abc']);
      assert.deepEqual(nm.match(fixtures, 'a[\\b]c'), ['abc']);
      assert.deepEqual(nm.match(fixtures, 'a?c'), ['abc']);
      assert.deepEqual(nm.match(['man/man1/bash.1'], '*/man*/bash.*'), ['man/man1/bash.1']);
    });

    it('tests with multiple `*\'s:', function() {
      assert.deepEqual(nm.match(['bbc', 'abc', 'bbd'], 'a**c'), ['abc']);
      assert.deepEqual(nm.match(['bbc', 'abc', 'bbd'], 'a***c'), ['abc']);
      assert.deepEqual(nm.match(['bbc', 'abc', 'bbc'], 'a*****?c'), ['abc']);
      assert.deepEqual(nm.match(['bbc', 'abc'], '?*****??'), ['bbc', 'abc']);
      assert.deepEqual(nm.match(['bbc', 'abc'], '*****??'), ['bbc', 'abc']);
      assert.deepEqual(nm.match(['bbc', 'abc'], '?*****?c'), ['bbc', 'abc']);
      assert.deepEqual(nm.match(['bbc', 'abc', 'bbd'], '?***?****c'), ['bbc', 'abc']);
      assert.deepEqual(nm.match(['bbc', 'abc'], '?***?****?'), ['bbc', 'abc']);
      assert.deepEqual(nm.match(['bbc', 'abc'], '?***?****'), ['bbc', 'abc']);
      assert.deepEqual(nm.match(['bbc', 'abc'], '*******c'), ['bbc', 'abc']);
      assert.deepEqual(nm.match(['bbc', 'abc'], '*******?'), ['bbc', 'abc']);
      assert.deepEqual(nm.match(['abcdecdhjk'], 'a*cd**?**??k'), ['abcdecdhjk']);
      assert.deepEqual(nm.match(['abcdecdhjk'], 'a**?**cd**?**??k'), ['abcdecdhjk']);
      assert.deepEqual(nm.match(['abcdecdhjk'], 'a**?**cd**?**??k***'), ['abcdecdhjk']);
      assert.deepEqual(nm.match(['abcdecdhjk'], 'a**?**cd**?**??***k'), ['abcdecdhjk']);
      assert.deepEqual(nm.match(['abcdecdhjk'], 'a**?**cd**?**??***k**'), ['abcdecdhjk']);
      assert.deepEqual(nm.match(['abcdecdhjk'], 'a****c**?**??*****'), ['abcdecdhjk']);
    });

    it('none of these should output anything:', function() {
      assert.deepEqual(nm.match(['abc'], '??**********?****?'), []);
      assert.deepEqual(nm.match(['abc'], '??**********?****c'), []);
      assert.deepEqual(nm.match(['abc'], '?************c****?****'), []);
      assert.deepEqual(nm.match(['abc'], '*c*?**'), []);
      assert.deepEqual(nm.match(['abc'], 'a*****c*?**'), []);
      assert.deepEqual(nm.match(['abc'], 'a********???*******'), []);
      assert.deepEqual(nm.match(['a'], '[]'), []);
      assert.deepEqual(nm.match(['['], '[abc'), []);
    });
  });
});
