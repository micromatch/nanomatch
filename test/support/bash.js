'use strict';

var extend = require('extend-shallow');
var bash = require('bash-glob');
var del = require('delete');
var write = require('./write');

module.exports = function(fixtures, pattern, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  fixtures = Array.isArray(fixtures) ? fixtures : [fixtures];
  var opts = extend({}, options);
  var content = opts.content || 'this is a fixture';

  write(fixtures, content, opts, function(err, files) {
    if (err) return cb(err);

    bash(pattern, opts, function(err, matches) {
      if (err) return cb(err);

      del(files, {force: true}, function(err) {
        if (err) return cb(err);
        cb(null, matches);
      });
    });
  });
};
