'use strict';

var fs = require('fs');
var path = require('path');
var write = require('write');
var mkdirp = require('mkdirp');
var each = require('async-each');
var isAbsolute = require('is-absolute');
var del = require('delete');

module.exports = function(fixtures, content, options) {
  fixtures = Array.isArray(fixtures) ? fixtures : [fixtures];
  var cwd = options.cwd || path.resolve(__dirname, '../fixtures');
  var files = [];

  var len = fixtures.length;
  var idx = -1;

  while (++idx < len) {
    var fp = path.resolve(cwd, fixtures[idx]);
    var dir = path.dirname(fp);

    if (!/test\/fixtures/.test(dir)) {
      continue;
    }

    var dirStat = tryStat(dir);
    if (dirStat === null) {
      mkdirp.sync(dir);
    } else if (dirStat.isFile()) {
      del.sync(dir);
    }

    var stat = tryStat(fp);
    if (stat && stat.isDirectory()) {
      continue;
    }

    if (stat && stat.isFile()) {
      continue;
    }

    files.push(fp);
    try {
      write.sync(fp, 'fixture');
    } catch (err) {
      // console.log(err);
      // console.log(dirStat);
      // console.log(stat);
    }
  }

  return files;
};

function tryStat(fp) {
  try {
    return fs.lstatSync(fp);
  } catch (err) {
    if (/test\/fixtures\/./.test(fp)) {
      del.sync(fp);
      mkdirp.sync(fp);
    }
  }
  return null;
}
