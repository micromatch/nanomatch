'use strict';

var match = require('./support/match');

describe('nanomatch', function() {
  it('should return an array of matches for a literal string', function() {
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], '(a/b)', ['a/b']);
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], 'a/b', ['a/b']);
  });

  it('should return an array of matches for an array of literal strings', function() {
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['(a/b)', 'a/c'], ['a/b', 'a/c']);
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['a/b', 'b/b'], ['a/b', 'b/b']);
  });

  it('should support regex logical or', function() {
    match(['a/a', 'a/b', 'a/c'], ['a/(a|c)'], ['a/a', 'a/c']);
    match(['a/a', 'a/b', 'a/c'], ['a/(a|b|c)', 'a/b'], ['a/a', 'a/b', 'a/c']);
  });

  it('should support regex ranges', function() {
    match(['a/a', 'a/b', 'a/c'], 'a/[b-c]', ['a/b', 'a/c']);
    match(['a/a', 'a/b', 'a/c', 'a/x/y', 'a/x'], 'a/[a-z]', ['a/a', 'a/b', 'a/c', 'a/x']);
  });

  it('should support single globs (*)', function() {
    var fixtures = ['a', 'b', 'a/a', 'a/b', 'a/c', 'a/x', 'a/a/a', 'a/a/b', 'a/a/a/a', 'a/a/a/a/a', 'x/y', 'z/z'];
    match(fixtures, ['*'], ['a', 'b']);
    match(fixtures, ['*/*'], ['a/a', 'a/b', 'a/c', 'a/x', 'x/y', 'z/z']);
    match(fixtures, ['*/*/*'], ['a/a/a', 'a/a/b']);
    match(fixtures, ['*/*/*/*'], ['a/a/a/a']);
    match(fixtures, ['*/*/*/*/*'], ['a/a/a/a/a']);
    match(fixtures, ['a/*'], ['a/a', 'a/b', 'a/c', 'a/x']);
    match(fixtures, ['a/*/*'], ['a/a/a', 'a/a/b']);
    match(fixtures, ['a/*/*/*'], ['a/a/a/a']);
    match(fixtures, ['a/*/*/*/*'], ['a/a/a/a/a']);
    match(fixtures, ['a/*/a'], ['a/a/a']);
    match(fixtures, ['a/*/b'], ['a/a/b']);
  });

  it('should support globstars (**)', function() {
    var fixtures = ['a/a', 'a/b', 'a/c', 'a/x', 'a/x/y', 'a/x/y/z'];
    match(fixtures, ['a/**'], fixtures);
    match(fixtures, ['a/**/*'], fixtures);
    match(fixtures, ['a/**/**/*'], fixtures);
  });

  it('should work with windows paths', function() {
    var fixtures = ['a.txt', 'a/b.txt', 'a/x/y.txt', 'a/x/y/z', 'a\\z.txt', 'a\\z\\z.txt', 'a\\z\\y\\z', 'a\\b\\z.txt'];
    match(fixtures, ['a/**/*.txt'], ['a/b.txt', 'a/x/y.txt', 'a/z.txt', 'a/z/z.txt', 'a/b/z.txt'], {unixify: true});
    match(fixtures, ['a/**/*.txt'], ['a/b.txt', 'a/x/y.txt']);
  });

  it('should support negation patterns', function() {
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['!a/b'], ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['*/*', '!a/b', '!*/c'], ['a/a', 'b/a', 'b/b']);
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['!a/b', '!*/c'], ['a/a', 'b/a', 'b/b']);
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['!a/b', '!a/c'], ['a/a', 'b/a', 'b/b', 'b/c']);
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['!a/(b)'], ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
    match(['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c'], ['!(a/b)'], ['a/a', 'a/c', 'b/a', 'b/b', 'b/c']);
  });
});
