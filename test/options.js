'use strict';

var assert = require('assert');
var argv = require('yargs-parser')(process.argv.slice(2));
var matcher = argv.mm ? require('minimatch') : require('..');

function match(arr, pattern, expected, options) {
  var actual = matcher.match(arr, pattern, options);
  assert.deepEqual(actual.sort(), expected.sort());
}

describe('options', function() {
  describe('options.ignore', function() {
    it('should filter out ignored patterns', function() {
      var globs = ['a', 'a/a', 'a/a/a', 'a/a/a/a', 'a/a/a/a/a', 'a/a/b', 'a/b', 'a/b/c', 'a/c', 'a/x', 'b', 'b/b/b', 'b/b/c', 'c/c/c', 'e/f/g', 'h/i/a', 'x/x/x', 'x/y', 'z/z', 'z/z/z'];
      var globstars = ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];
      var negations = ['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'];

      var opts = {ignore: ['a/**']};

      match(globs, '*', ['a', 'b'], opts);
      match(globs, '*/*', ['x/y', 'z/z'], opts);
      match(globs, '*/*/*', ['b/b/b', 'b/b/c', 'c/c/c', 'e/f/g', 'h/i/a', 'x/x/x', 'z/z/z'], opts);
      match(globs, '*/*/*/*', [], opts);
      match(globs, '*/*/*/*/*', [], opts);
      match(globs, 'a/*', [], opts);
      match(globs, '**/*/x', ['x/x/x'], opts);

      match(negations, '!b/a', ['b/b', 'b/c'], opts);
      match(negations, '!b/(a)', ['b/b', 'b/c'], opts);
      match(negations, '!(b/(a))', ['b/b', 'b/c'], opts);
      match(negations, '!(b/a)', ['b/b', 'b/c'], opts);
    });
  });

  describe('options.matchBase', function() {
    it('should support the `matchBase` option:', function() {
      match(['a/b/c/d.md'], '*.md', []);
      match(['a/b/c/d.md'], '*.md', ['a/b/c/d.md'], {matchBase: true});
    });
  });

  describe('options.nocase', function() {
    it('should support `options.nocase` option:', function() {
      match(['a/b/d/e.md'], 'a/b/c/*.md', []);
      match(['a/b/c/e.md'], 'A/b/C/*.md', []);
      match(['a/b/c/e.md'], 'A/b/C/*.md', ['a/b/c/e.md'], {nocase: true});
      match(['a/b/c/e.md'], 'A/b/C/*.MD', ['a/b/c/e.md'], {nocase: true});
    });
  });

  describe('options.dot', function() {
    it('should match dotfiles when `options.dot` is true:', function() {
      match(['.dotfile'], '*.*', ['.dotfile'], {dot: true});
      match(['.dotfile'], '*.md', [], {dot: true});
      match(['.dotfile'], '.dotfile', ['.dotfile'], {dot: true});
      match(['.dotfile.md'], '.*.md', ['.dotfile.md'], {dot: true});
      match(['.verb.txt'], '*.md', [], {dot: true});
      match(['.verb.txt'], '*.md', [], {dot: true});
      match(['a/b/c/.dotfile'], '*.md', [], {dot: true});
      match(['a/b/c/.dotfile.md'], '**/*.md', ['a/b/c/.dotfile.md'], {dot: true});
      match(['a/b/c/.dotfile.md'], '**/.*', ['a/b/c/.dotfile.md']);
      match(['a/b/c/.dotfile.md'], '**/.*.md', ['a/b/c/.dotfile.md']);
      match(['a/b/c/.dotfile.md'], '*.md', []);
      match(['a/b/c/.dotfile.md'], '*.md', [], {dot: true});
      match(['a/b/c/.verb.md'], '**/*.md', ['a/b/c/.verb.md'], {dot: true});
      match(['d.md'], '*.md', ['d.md'], {dot: true});
    });
  });
});
