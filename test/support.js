'use strict';

var path = require('path');
var assert = require('assert');
var exists = require('./support/exists');
var write = require('./support/write');
var bash = require('./support/bash');
var del = require('delete');
var dir = path.join.bind(path, __dirname, 'fixtures');
var base = path.join(__dirname, '..');

describe('when doing bash comparisons', function() {
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
    afterEach(function(cb) {
      del(dir(), cb);
    });

    it('should write text fixtures', function() {
      var fixtures = ['a.txt', 'a/b/c/one.txt'];
      write(fixtures, 'this is a fixture', {cwd: dir()});
      assert(exists(fixtures, dir()), 'should exist');
    });

    it('should return the list of written files', function() {
      var fixtures = ['a.txt', 'a/b/c/one.txt'];
      var files = write(fixtures, 'this is a fixture', {cwd: dir()});
      assert.equal(files.length, 2);
    });
  });


  describe('.bash', function() {
    afterEach(function(cb) {
      del(dir(), {force: true}, cb);
    });

    it('should return an array of fixtures that match the given pattern', function() {
      if (process.env.TRAVIS) {
        return this.skip();
      }

      var fixtures = ['a.txt', 'a/b/c/one.txt', 'foo/bar'];
      var matches = bash(fixtures, '**/*.txt');
      assert.deepEqual(matches, ['a.txt', 'a/b/c/one.txt']);
    });
  });
});
