'use strict';

var path = require('path');
var debug = require('debug')('nanomatch');
var toRegex = require('to-regex');
var Nanomatch = require('./lib/nanomatch');
var compilers = require('./lib/compilers');
var parsers = require('./lib/parsers');
var utils = require('./lib/utils');
var MAX_LENGTH = 1024 * 64;
var cache = {matcher: {}, makeRe: {}, regex: {}};

/**
 * Convert the given `glob` pattern into a regex-compatible string.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * var str = nanomatch('*.js');
 * console.log(str);
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {String}
 * @api public
 */

function nanomatch(files, pattern, options) {
  debug('nanomatch <%s>', patterns);
  if (!Array.isArray(files)) {
    return [];
  }

  if (!Array.isArray(patterns)) {
    return nanomatch.match.apply(nanomatch, arguments);
  }

  var opts = utils.extend({cache: true}, options);
  var omit = [];
  var keep = [];

  var len = patterns.length;
  var idx = -1;

  while (++idx < len) {
    var pattern = patterns[idx];
    if (typeof pattern === 'string' && pattern.charCodeAt(0) === 33 /* ! */) {
      omit.push.apply(omit, nanomatch.match(files, pattern.slice(1), opts));
    } else {
      keep.push.apply(keep, nanomatch.match(files, pattern, opts));
    }
  }

  return utils.diff(keep, omit);
}

/**
 * Takes an array of strings and a glob pattern and returns a new
 * array that contains only the strings that match the pattern.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * console.log(nanomatch.match(['a.a', 'a.aa', 'a.b', 'a.c'], '*.a'));
 * //=> ['a.a', 'a.aa']
 * ```
 * @param {Array} `arr` Array of strings to match
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Array}
 * @api public
 */

nanomatch.match = function(files, pattern, options) {
  debug('match <%s>', pattern);
  var opts = utils.extend({}, options);
  var isMatch = nanomatch.matcher(pattern, opts);
  var unixify = utils.unixify(opts);
  var matches = [];

  files = utils.arrayify(files);
  var len = files.length;
  var idx = -1;

  while (++idx < len) {
    var file = unixify(files[idx]);
    if (isMatch(file)) {
      matches.push(file);
    }
  }

  if (matches.length === 0) {
    if (opts.failglob === true) {
      throw new Error('no matches found for "' + pattern + '"');
    }
    if (opts.nonull === true || opts.nullglob === true) {
      return [pattern.split('\\').join('')];
    }
  }

  // if `ignore` was defined, diff ignored files
  if (opts.ignore) {
    var ignore = utils.arrayify(opts.ignore);
    delete opts.ignore;
    var ignored = nanomatch(matches, ignore, opts);
    matches = utils.diff(matches, ignored);
  }

  return opts.nodupes ? utils.unique(matches) : matches;
};

/**
 * Takes an array of strings and a one or more glob patterns and returns a new
 * array with strings that match any of the given patterns.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * console.log(nanomatch.create(['a.a', 'a.b', 'a.c'], ['*.!(*a)']));
 * //=> ['a.b', 'a.c']
 * ```
 * @param {Array} `arr` Array of strings to match
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Array}
 * @api public
 */

nanomatch.create = function(pattern, options) {
  debug('nanomatch.create <%s>', pattern);
  var nano = new Nanomatch(options);
  var ast = nano.parse(pattern, options);
  return nano.compile(ast, options);
};

/**
 * Returns true if a file path matches any of the
 * given patterns.
 *
 * @param  {String} `fp` The filepath to test.
 * @param  {String|Array} `patterns` Glob patterns to use.
 * @param  {Object} `opts` Options to pass to the `matcher()` function.
 * @return {String}
 */

nanomatch.any = function(filepath, patterns, options) {
  if (typeof patterns === 'string') {
    patterns = [patterns];
  }

  if (!Array.isArray(patterns)) {
    throw new TypeError('expected patterns to be a string or array');
  }

  debug('match <%s>', patterns);
  var unixify = utils.unixify(opts);
  var opts = utils.extend({}, options);

  filepath = unixify(filepath);
  var len = patterns.length;

  for (var i = 0; i < len; i++) {
    var pattern = patterns[i];
    if (!utils.isString(pattern)) {
      continue;
    }

    if (!utils.isGlob(pattern)) {
      if (filepath === pattern) {
        return true;
      }
      if (opts.contains && filepath.indexOf(pattern) !== -1) {
        return true;
      }
      continue;
    }

    if (nanomatch.isMatch(filepath, pattern, opts)) {
      return true;
    }
  }
  return false;
};

/**
 * Returns true if the filepath matches the
 * given pattern.
 */

nanomatch.contains = function(filepath, pattern, options) {
  if (typeof filepath !== 'string') {
    throw new TypeError('expected filepath to be a string');
  }
  if (typeof pattern !== 'string') {
    throw new TypeError('expected pattern to be a string');
  }

  var opts = utils.extend({contains: pattern !== ''}, options);
  opts.strictClose = false;
  opts.strictOpen = false;

  if (opts.contains && !utils.isGlob(pattern)) {
    filepath = utils.unixify(opts)(filepath);
    return filepath.indexOf(pattern) !== -1;
  }
  return nanomatch.matcher(pattern, opts)(filepath);
};

/**
 * Returns true if the specified `string` matches the given
 * glob `pattern`.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 *
 * console.log(nanomatch.isMatch('a.a', '*.!(*a)'));
 * //=> false
 * console.log(nanomatch.isMatch('a.b', '*.!(*a)'));
 * //=> true
 * ```
 * @param {String} `string` String to match
 * @param {String} `pattern` Glob pattern
 * @param {String} `options`
 * @return {Boolean}
 * @api public
 */

nanomatch.isMatch = function(filepath, pattern, options) {
  if (pattern === '' || pattern === ' ') {
    return filepath === pattern;
  }

  if (options) {
    if (nanomatch.matchBase(pattern, options)) {
      filepath = path.basename(filepath);

    } else if (options.extname === true) {
      filepath = path.extname(filepath);

    } else if (options.dirname === true) {
      filepath = path.dirname(filepath);
    }
  }

  var isMatch = nanomatch.matcher(pattern, options);
  return isMatch(filepath);
};

/**
 * Takes a glob pattern and returns a matcher function. The returned
 * function takes the string to match as its only argument.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * var isMatch = nanomatch.matcher('*.!(*a)');
 *
 * console.log(isMatch('a.a'));
 * //=> false
 * console.log(isMatch('a.b'));
 * //=> true
 * ```
 * @param {String} `pattern` Glob pattern
 * @param {String} `options`
 * @return {Boolean}
 * @api public
 */

nanomatch.matcher = function(pattern, options) {
  // pattern is a function
  if (typeof pattern === 'function') {
    return pattern;
  }

  var opts = utils.extend({}, options);
  var unixify = utils.unixify(opts);
  var matcher;
  var regex;

  // pattern is a regex
  if (pattern instanceof RegExp) {
    return function(fp) {
      return pattern.test(unixify(fp));
    };
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('expected pattern to be a string, regex or function');
  }

  var key = pattern;
  if (options) {
    for (var prop in options) {
      if (options.hasOwnProperty(prop)) {
        key += ';' + prop + '=' + String(options[prop]);
      }
    }
  }

  if (cache.matcher.hasOwnProperty(key)) {
    return cache.matcher[key];
  }

  // pattern is a non-glob string
  if (!utils.hasSpecialChars(pattern)) {
    matcher = utils.matchPath(unixify(pattern), opts);
    cache.matcher[key] = matcher;
    return matcher;
  }

  // pattern is a glob string
  var regex = cache.regex[key] || (cache.regex[key] = nanomatch.makeRe(pattern, options));

  // `options.matchBase` or `options.basename` is defined
  if (nanomatch.matchBase(pattern, options)) {
    matcher = utils.matchBasename(regex);
  } else {
    matcher = function(fp) {
      return regex.test(unixify(fp));
    };
  }

  cache.matcher[key] = matcher;
  return matcher;
};

/**
 * Returns true if the given pattern and options should enable
 * the `matchBase` option.
 * @return {Boolean}
 */

nanomatch.matchBase = function(pattern, options) {
  if (pattern && pattern.indexOf('/') !== -1 || !options) return false;
  return options.basename === true || options.matchBase === true;
};

/**
 * Create a regular expression from the given string `pattern`.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * var re = nanomatch.makeRe('[[:alpha:]]');
 * console.log(re);
 * //=> /^(?:[a-zA-Z])$/
 * ```
 * @param {String} `pattern` The pattern to convert to regex.
 * @param {Object} `options`
 * @return {RegExp}
 * @api public
 */

nanomatch.makeRe = function(pattern, options) {
  if (pattern instanceof RegExp) {
    return pattern;
  }

  var key = pattern;
  if (options) {
    for (var prop in options) {
      if (options.hasOwnProperty(prop)) {
        key += ';' + prop + '=' + String(options[prop]);
      }
    }
  }

  if ((!options || options.cache !== false) && cache.makeRe.hasOwnProperty(key)) {
    return cache.makeRe[key];
  }

  if (pattern.length > MAX_LENGTH) {
    throw new Error('expected pattern to be less than ' + MAX_LENGTH + ' characters');
  }

  var res = nanomatch.create(pattern, options);
  var opts = utils.extend({strictErrors: false}, options);
  var regex = cache[key] = toRegex(res.output, opts);
  if (regex.source.length > MAX_LENGTH) {
    throw new SyntaxError('potentially malicious regex detected');
  }

  return regex;
};

/**
 * Expose `Nanomatch` parser/compiler constructor
 * @type {Function}
 */

nanomatch.Nanomatch = Nanomatch;
nanomatch.compilers = compilers;
nanomatch.parsers = parsers;

/**
 * Expose `nanomatch`
 */

module.exports = nanomatch;
