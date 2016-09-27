/*!
 * micromatch <https://github.com/jonschlinkert/micromatch>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var assert = require('assert');
var nm = require('..');

describe('.matchKeys', function() {
  describe('error handling', function() {
    it('should throw when the first argument is not an object', function() {
      assert.throws(function() {
        nm.matchKeys();
      }, /expected the first argument to be an object/);

      assert.throws(function() {
        nm.matchKeys('foo');
      }, /expected the first argument to be an object/);

      assert.throws(function() {
        nm.matchKeys(['foo']);
      }, /expected the first argument to be an object/);
    });
  });

  describe('match object keys', function() {
    it('should return a new object with only keys that match the given glob pattern', function() {
      assert.deepEqual(nm.matchKeys({a: 'a', b: 'b', c: 'c'}, '*'), {a: 'a', b: 'b', c: 'c'});
      assert.deepEqual(nm.matchKeys({a: 'a', b: 'b', c: 'c'}, 'a'), {a: 'a'});
      assert.deepEqual(nm.matchKeys({a: 'a', b: 'b', c: 'c'}, '[a-b]'), {a: 'a', b: 'b'});
      assert.deepEqual(nm.matchKeys({a: 'a', b: 'b', c: 'c'}, '(a|c)'), {a: 'a', c: 'c'});
      assert.notDeepEqual(nm.matchKeys({a: 'a', b: 'b', c: 'c'}, 'a'), {b: 'b'});
    });

    it('should return a new object with only keys that match a regex:', function() {
      assert.deepEqual(nm.matchKeys({a: 'a', b: 'b', c: 'c'}, /.*/), {a: 'a', b: 'b', c: 'c'});
      assert.deepEqual(nm.matchKeys({a: 'a', b: 'b', c: 'c'}, /a/), {a: 'a'});
      assert.deepEqual(nm.matchKeys({a: 'a', b: 'b', c: 'c'}, /[a-b]/), {a: 'a', b: 'b'});
      assert.deepEqual(nm.matchKeys({a: 'a', b: 'b', c: 'c'}, /(a|c)/), {a: 'a', c: 'c'});
      assert.notDeepEqual(nm.matchKeys({a: 'a', b: 'b', c: 'c'}, /a/), {b: 'b'});
    });
  });
});
