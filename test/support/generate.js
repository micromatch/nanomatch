'use strict';

var path = require('path');
var extend = require('extend-shallow');
var cwd = path.join.bind(path, __dirname, '../fixtures');
var bash = require('./bash');

module.exports = function(fixtures, glob, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var opts = extend({cwd: cwd}, options);
  if (typeof glob === 'string' || Array.isArray(glob)) {
    glob = { pattern: glob };
  }

  glob.options = extend({}, glob.options, options);
  // bash({fixtures, cwd}, glob, cb);
  cb();
};
