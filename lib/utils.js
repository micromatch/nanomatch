'use strict';

var utils = module.exports;
var path = require('path');
var cache = {};

/**
 * Module dependencies
 */

utils.define = require('define-property');
utils.diff = require('arr-diff');
utils.extend = require('extend-shallow');
utils.isGlob = require('is-glob');
utils.typeOf = require('kind-of');
utils.pick = require('object.pick');
utils.union = require('arr-union');
utils.unique = require('array-unique');

/**
 * Create the key to use for memoization. The key is generated
 * by iterating over the options and concatenating key-value pairs
 * to the pattern string.
 */

utils.createKey = function(pattern, options) {
  var key = pattern;
  if (typeof options === 'undefined') {
    return key;
  }
  for (var prop in options) {
    if (options.hasOwnProperty(prop)) {
      key += ';' + prop + '=' + String(options[prop]);
    }
  }
  return key;
};

/**
 * Cast `val` to an array
 * @return {Array}
 */

utils.arrayify = function(val) {
  if (typeof val === 'string') return [val];
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

/**
 * Return true if `val` is a non-empty string
 */

utils.isString = function(val) {
  return typeof val === 'string';
};

/**
 * Return true if `val` is a non-empty string
 */

utils.isRegex = function(val) {
  return utils.typeOf(val) === 'regexp';
};

/**
 * Return true if `val` is a non-empty string
 */

utils.isObject = function(val) {
  return utils.typeOf(val) === 'object';
};

/**
 * Escape regex characters in the given string
 */

utils.escapeRegex = function(str) {
  return str.replace(/[\-\[\]{}()^$|\s*+?.\\\/]/g, '\\$&');
};

/**
 * Combines duplicate characters in the provided string.
 * @param {String} `str`
 * @returns {String}
 */

utils.combineDuplicates = function(str, val) {
  if (typeof val === 'string') {
    var re = new RegExp('(' + val + ')(?=(?:' + val + ')*\\1)', 'g');
    return str.replace(re, '');
  }
  return str.replace(/(.)(?=.*\1)/g, '');
};

/**
 * Returns true if the given `str` has special characters
 */

utils.hasSpecialChars = function(str) {
  return /(?:(?:(^|\/)[!.])|[*?+()|\[\]{}]|[+@]\()/.test(str);
};

/**
 * Strip backslashes from a string.
 *
 * @param {String} `filepath`
 * @return {String}
 */

utils.unescape = function(str) {
  return utils.normalize(str.replace(/\\(\W)/g, '$1'));
};

/**
 * Normalize slashes in the given filepath.
 *
 * @param {String} `filepath`
 * @return {String}
 */

utils.normalize = function(filepath) {
  return filepath.replace(/[\\\/]+(?=[\w._-])(?![*?+\\!])/g, '/');
};

/**
 * Returns true if `str` is a common character that doesn't need
 * to be processed to be used for matching.
 * @param {String} `str`
 * @return {Boolean}
 */

utils.isSimpleChar = function(str) {
  return str === '' || str === ' ' || str === '.';
};

utils.isSlash = function(str) {
  return str === '/' || str === '\\' || str === '\\\\';
};

/**
 * Returns a function that returns true if the given
 * pattern matches or contains a `filepath`
 *
 * @param {String} `pattern`
 * @return {Function}
 */

utils.matchPath = function(pattern, options) {
  return (options && options.contains)
    ? utils.containsPattern(pattern, options)
    : utils.equalsPattern(pattern, options);
};

/**
 * Returns a function that returns true if the given
 * pattern is the same as a given `filepath`
 *
 * @param {String} `pattern`
 * @return {Function}
 */

utils.equalsPattern = function(pattern, options) {
  var unixify = utils.unixify(options);

  return function(filepath) {
    if (options && options.nocase === true) {
      filepath = filepath.toLowerCase();
    }
    return pattern === filepath || pattern === unixify(filepath);
  };
};

/**
 * Returns a function that returns true if the given
 * pattern contains a `filepath`
 *
 * @param {String} `pattern`
 * @return {Function}
 */

utils.containsPattern = function(pattern, options) {
  var unixify = utils.unixify(options);
  return function(filepath) {
    if (options && options.nocase === true) {
      return unixify(filepath.toLowerCase()).indexOf(pattern) !== -1;
    } else {
      return unixify(filepath).indexOf(pattern) !== -1;
    }
  };
};

/**
 * Returns a function that returns true if the given
 * regex matches the `filename` of a file path.
 *
 * @param {RegExp} `re` Matching regex
 * @return {Function}
 */

utils.matchBasename = function(re) {
  return function(filepath) {
    return re.test(filepath) || re.test(path.basename(filepath));
  };
};

/**
 * Strip the prefix from a filepath
 * @param {String} `filepath`
 * @return {String}
 */

utils.stripPrefix = function(fp) {
  if (typeof fp !== 'string') {
    return fp;
  }

  var ch0 = fp.charAt(0);
  var ch1 = fp.charAt(1);

  if (ch0 === '.' && (ch1 === '/' || ch1 === '\\')) {
    return fp.slice(2);
  }
  return fp;
};

/**
 * Normalize all slashes in a file path or glob pattern to
 * forward slashes.
 */

utils.unixify = function(options) {
  var key = utils.createKey('unixify', options);

  if (cache.hasOwnProperty(key) && path.sep === '/') {
    return cache[key];
  }

  var unixify = function(filepath) {
    return utils.stripPrefix(filepath);
  };

  options = options || {};
  if (path.sep !== '/' || options.unixify === true || options.normalize === true) {
    unixify = function(filepath) {
      return utils.stripPrefix(utils.normalize(filepath));
    };
  }

  if (options.unescape === true) {
    unixify = function(filepath) {
      return utils.stripPrefix(utils.normalize(utils.unescape(filepath)));
    };
  }

  cache[key] = unixify;
  return unixify;
};
