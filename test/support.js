'use strict';

var path = require('path');
var assert = require('assert');
var generate = require('./support/generate');
var exists = require('./support/exists');
var write = require('./support/write');
var bash = require('./support/bash');
var del = require('delete');
var cwd = path.join.bind(path, __dirname, 'fixtures');
var base = path.join(__dirname, '..');

describe.skip('when doing bash comparisons', function() {
  afterEach(function(cb) {
    del(cwd, {force: true}, cb);
  });

  describe('.exists', function() {
    it('should return true when a file exists', function() {
      assert(exists(path.join(__dirname, '../index.js')));
    });

    it('should return false when a file does not exist', function() {
      assert(!exists(path.join(__dirname, '../aslfjsalkasj.js')));
    });

    it('should return true when a file exists in the given cwd', function() {
      assert(exists('index.js', base));
    });

    it('should return true when an array of files exists', function() {
      assert(exists(['index.js', 'LICENSE'], base));
    });

    it('should return true when a file in an array does not exists', function() {
      assert(!exists(['index.js', 'asfljslksksls'], base));
    });
  });

  describe('.write', function() {
    it('should write text fixtures', function(cb) {
      var fixtures = ['a.txt', 'a/b/c/one.txt'];
      write(fixtures, 'this is a fixture', {cwd: cwd()}, function(err) {
        if (err) return cb(err);
        assert(exists(fixtures, cwd()), 'should exist');
        cb();
      });
    });

    it('should expose the list of written files in the callback', function(cb) {
      var fixtures = ['a.txt', 'a/b/c/one.txt'];
      write(fixtures, 'this is a fixture', {cwd: cwd()}, function(err, files) {
        if (err) return cb(err);
        assert.equal(files.length, 2);
        cb();
      });
    });
  });

  describe('.bash', function() {
    it('should return an array of fixtures that match the given pattern', function(cb) {
      var fixtures = ['a.txt', 'a/b/c/one.txt', 'foo/bar'];
      bash(fixtures, '**/*.txt', function(err, matches) {
        if (err) return cb(err);
        assert.deepEqual(matches, ['a.txt', 'a/b/c/one.txt']);
        cb();
      });
    });
  });
});
