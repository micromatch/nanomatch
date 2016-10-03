'use strict';

var path = require('path');
var write = require('write');
var each = require('async-each');

module.exports = function(fixtures, content, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};

  }

  fixtures = Array.isArray(fixtures) ? fixtures : [fixtures];
  var cwd = options.cwd || path.resolve(__dirname, '../fixtures');
  var files = [];

  each(fixtures, function(fixture, next) {
    var fp = path.resolve(cwd, fixture);
    files.push(fp);

    write(fp, 'fixture', function(err) {
      if (err && err.code !== 'EEXIST') {
        next(err);
        return;
      }
      next();
    });
  }, function(err) {
    if (err) return cb(err);
    cb(null, files);
  });
};
