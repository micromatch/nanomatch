'use strict';

var assert = require('assert');
var argv = require('yargs-parser')(process.argv.slice(2));
var matcher = argv.mm ? require('minimatch') : require('..');

function match(arr, pattern, expected, options) {
  var actual = matcher.match(arr, pattern, options);
  assert.deepEqual(actual.sort(), expected.sort());
}

describe('special characters', function() {
  describe('$ dollar signs', function() {
    it('should treat dollar signs as literal:', function() {
      assert(matcher.isMatch('$', '$'));
      assert(matcher.isMatch('$/foo', '$/*'));
      assert(matcher.isMatch('$/foo', '$/*'));
      assert(matcher.isMatch('$foo/foo', '$foo/*'));
      assert(matcher.isMatch('foo$/foo', 'foo$/*'));
    });
  });

  describe('misc', function() {
    it('should treat common URL characters as literals', function() {
      assert(matcher.isMatch(':', ':'));
      assert(matcher.isMatch(':/foo', ':/*'));
      assert(matcher.isMatch('D:\\/\\/foo', 'D:\\/\\/*'));
    });
  });

  describe('?:', function() {
    it('should match one character per question mark:', function() {
      match(['a/b/c.md'], 'a/?/c.md', ['a/b/c.md']);
      match(['a/bb/c.md'], 'a/?/c.md', []);
      match(['a/bb/c.md'], 'a/??/c.md', ['a/bb/c.md']);
      match(['a/bbb/c.md'], 'a/??/c.md', []);
      match(['a/bbb/c.md'], 'a/???/c.md', ['a/bbb/c.md']);
      match(['a/bbbb/c.md'], 'a/????/c.md', ['a/bbbb/c.md']);
    });

    it('should match multiple groups of question marks:', function() {
      match(['a/bb/c/dd/e.md'], 'a/?/c/?/e.md', []);
      match(['a/b/c/d/e.md'], 'a/?/c/?/e.md', ['a/b/c/d/e.md']);
      match(['a/b/c/d/e.md'], 'a/?/c/???/e.md', []);
      match(['a/b/c/zzz/e.md'], 'a/?/c/???/e.md', ['a/b/c/zzz/e.md']);
    });

    it('should use special characters and glob stars together:', function() {
      match(['a/b/c/d/e.md'], 'a/?/c/?/*/e.md', []);
      match(['a/b/c/d/e/e.md'], 'a/?/c/?/*/e.md', ['a/b/c/d/e/e.md']);
      match(['a/b/c/d/efghijk/e.md'], 'a/?/c/?/*/e.md', ['a/b/c/d/efghijk/e.md']);
      match(['a/b/c/d/efghijk/e.md'], 'a/?/**/e.md', ['a/b/c/d/efghijk/e.md']);
      // match(['a/bb/c/d/efghijk/e.md'], 'a/?/**/e.md', []);
      match(['a/b/c/d/efghijk/e.md'], 'a/*/?/**/e.md', ['a/b/c/d/efghijk/e.md']);
      match(['a/b/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md', ['a/b/c/d/efgh.ijk/e.md']);
      match(['a/b.bb/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md', ['a/b.bb/c/d/efgh.ijk/e.md']);
      match(['a/bbb/c/d/efgh.ijk/e.md'], 'a/*/?/**/e.md', ['a/bbb/c/d/efgh.ijk/e.md']);
    });
  });

  describe('[ab] - brackets:', function() {
    it('should support regex character classes:', function() {
      match(['a/b.md', 'a/c.md', 'a/d.md', 'a/E.md'], 'a/[A-Z].md', ['a/E.md']);
      match(['a/b.md', 'a/c.md', 'a/d.md'], 'a/[bd].md', ['a/b.md', 'a/d.md']);
      match(['a-1.md', 'a-2.md', 'a-3.md', 'a-4.md', 'a-5.md'], 'a-[2-4].md', ['a-2.md', 'a-3.md', 'a-4.md']);
      match(['a/b.md', 'b/b.md', 'c/b.md', 'b/c.md', 'a/d.md'], '[bc]/[bd].md', ['b/b.md', 'c/b.md']);
    });
  });

  describe('(a|b) - logical OR:', function() {
    it('should support regex logical OR:', function() {
      match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b'], '(a|b)/b', ['a/b', 'b/b']);
      match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'c/b'], '((a|b)|c)/b', ['a/b', 'b/b', 'c/b']);
      match(['a/b.md', 'a/c.md', 'a/d.md'], 'a/(b|d).md', ['a/b.md', 'a/d.md']);
      match(['a-1.md', 'a-2.md', 'a-3.md', 'a-4.md', 'a-5.md'], 'a-(2|3|4).md', ['a-2.md', 'a-3.md', 'a-4.md']);
      match(['a/b.md', 'b/b.md', 'c/b.md', 'b/c.md', 'a/d.md'], '(b|c)/(b|d).md', ['b/b.md', 'c/b.md']);
    });
  });
});
