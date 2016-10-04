'use strict';

var path = require('path');
var extend = require('extend-shallow');
var bash = require('bash-glob');
var del = require('delete');
var write = require('./write');

module.exports = function(fixtures, pattern, options) {
  fixtures = Array.isArray(fixtures) ? fixtures : [fixtures];
  var opts = extend({}, options);
  var content = opts.content || 'this is a fixture';
  opts.cwd = opts.cwd || path.join(__dirname, '../fixtures');
  del.sync(opts.cwd);
  write(fixtures, content, opts);
  return bash.sync(pattern, opts);
};
