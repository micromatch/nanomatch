'use strict';

var isWindows = process.platform === 'win32';
var path = require('path');

exports.fill = require('fill-array');
exports.unique = require('array-unique');
exports.define = require('define-property');
exports.extend = require('extend-shallow');
exports.repeat = require('repeat-string');
exports.normalize = require('normalize-path');
exports.isGlob = require('is-glob');
exports.diff = require('arr-diff');
var unixifyCache = {};

/**
 * Create a negation regex from the given string
 * @param {String} `str`
 * @return {RegExp}
 */

exports.not = function(str) {
  return '^((?!(?:' + str + ')).)*';
};

exports.expand = function(str) {
  var segs = str.split(',').filter(Boolean);
  var arr = segs.slice();

  if (arr.length === 1) {
    arr = str.split('..');

    if (arr.length > 1) {
      segs = exports.fill.apply(null, arr);
    }
  }
  return segs;
};

exports.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

/**
 * Return true if `val` is a non-empty string
 */

exports.isString = function(val) {
  return val && typeof val === 'string';
};

/**
 * Get the last element from `array`
 * @param {Array} `array`
 * @return {*}
 */

exports.last = function(arr) {
  return arr[arr.length - 1];
};

exports.hasSpecialChars = function(str) {
  return /(?:(^|\/)[!.]|[*?()\[\]{}]|[+@]\()/.test(str);
};

/**
 * Returns a function that returns true if the given
 * regex matches the `filename` of a file path.
 *
 * @param {RegExp} `re` Matching regex
 * @return {Function}
 */

exports.matchBasename = function(re) {
  return function(filepath) {
    return re.test(filepath) || re.test(path.basename(filepath));
  };
};

/**
 * Returns a function that returns true if the given
 * pattern matches or contains a `filepath`
 *
 * @param {String} `pattern`
 * @return {Function}
 */

exports.matchPath = function(pattern, options) {
  return (options && options.contains)
    ? exports.containsPath(pattern, options)
    : exports.equalsPath(pattern, options);
};

/**
 * Returns a function that returns true if the given
 * pattern is the same as a given `filepath`
 *
 * @param {String} `pattern`
 * @return {Function}
 */

exports.equalsPath = function(pattern, options) {
  return function(filepath) {
    if (options.nocase === true) {
      return pattern.toLowerCase() === filepath.toLowerCase();
    } else {
      return pattern === filepath;
    }
  };
};

/**
 * Returns a function that returns true if the given
 * pattern contains a `filepath`
 *
 * @param {String} `pattern`
 * @return {Function}
 */

exports.containsPath = function(pattern) {
  return function(filepath) {
    return pattern.indexOf(filepath) !== -1;
  };
};

exports.stripPrefix = function(filepath, options) {
  var opts = exports.extend({}, options);
  if (opts.normalize !== true) {
    return filepath;
  }

  filepath = String(filepath || '');
  if (filepath.slice(0, 2) === './') {
    return filepath.slice(2);
  }
  return filepath;
};

/**
 * Normalize all slashes in a file path or glob pattern to
 * forward slashes.
 */

exports.unixify = function(options) {
  var opts = exports.extend({}, options);
  var unixify;
  var key = '';

  for (var prop in opts) {
    if (opts.hasOwnProperty(prop)) {
      key += ':' + prop + ':' + String(opts[prop]);
    }
  }

  if (unixifyCache.hasOwnProperty(key)) {
    return unixifyCache[key];
  }

  if (path.sep !== '/' || opts.unixify === true) {
    unixify = function(filepath) {
      return exports.normalize(exports.stripPrefix(filepath, opts), false);
    };

  } else if (opts.unescape === true) {
    unixify = function(filepath) {
      return exports.stripPrefix(filepath, opts).replace(/\\([-.\w])/g, '$1');
    };

  } else {
    unixify = function(filepath) {
      return exports.stripPrefix(filepath, opts);
    };
  }

  unixifyCache[key] = unixify;
  return unixify;
};
