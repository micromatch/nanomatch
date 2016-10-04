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

  describe('colons and drive letters', function() {
    it('should treat common URL characters as literals', function() {
      assert(matcher.isMatch(':', ':'));
      assert(matcher.isMatch(':/foo', ':/*'));
      assert(matcher.isMatch('D:\\/\\/foo', 'D:\\\\/\\\\/*'));
    });
  });

  describe('[ab] - brackets:', function() {
    it('should support regex character classes:', function() {
      match(['a/b.md', 'a/c.md', 'a/d.md', 'a/E.md'], 'a/[A-Z].md', ['a/E.md']);
      match(['a/b.md', 'a/c.md', 'a/d.md'], 'a/[bd].md', ['a/b.md', 'a/d.md']);
      match(['a-1.md', 'a-2.md', 'a-3.md', 'a-4.md', 'a-5.md'], 'a-[2-4].md', ['a-2.md', 'a-3.md', 'a-4.md']);
      match(['a/b.md', 'b/b.md', 'c/b.md', 'b/c.md', 'a/d.md'], '[bc]/[bd].md', ['b/b.md', 'c/b.md']);
    });

    it('should handle unclosed brackets', function() {
      match(['[!ab', '[ab'], '[!a*', ['[!ab']);
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
