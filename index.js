'use strict';

/**
 * Module dependencies
 */

var path = require('path');
var toRegex = require('to-regex');
var Snapdragon = require('snapdragon');
var debug = require('debug')('nanomatch');
var extend = require('extend-shallow');

/**
 * Local dependencies
 */

var compilers = require('./lib/compilers');
var parsers = require('./lib/parsers');
var cache = require('./lib/cache');
var utils = require('./lib/utils');
var MAX_LENGTH = 1024 * 64;

/**
 * The main function takes a list of strings and one or more
 * glob patterns to use for matching.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * console.log(nanomatch(['a.js', 'a.txt'], ['*.js']));
 * //=> [ 'a.js' ]
 * ```
 * @param {Array} `list`
 * @param {String|Array} `patterns` Glob patterns
 * @param {Object} `options`
 * @return {Array} Returns an array of matches
 * @api public
 */

function nanomatch(list, patterns, options) {
  debug('nanomatch <%s>', patterns);

  patterns = utils.arrayify(patterns);
  list = utils.arrayify(list);
  var len = patterns.length;

  if (list.length === 0 || len === 0) {
    return [];
  }

  if (len === 1) {
    return nanomatch.match(list, patterns[0], options);
  }

  var negated = false;
  var omit = [];
  var keep = [];
  var idx = -1;

  while (++idx < len) {
    var pattern = patterns[idx];

    if (typeof pattern === 'string' && pattern.charCodeAt(0) === 33 /* ! */) {
      omit.push.apply(omit, nanomatch.match(list, pattern.slice(1), options));
      negated = true;
    } else {
      keep.push.apply(keep, nanomatch.match(list, pattern, options));
    }
  }

  // minimatch.match parity
  if (negated && keep.length === 0) {
    keep = list.map(utils.unixify(options));
  }

  var matches = utils.diff(keep, omit);
  if (!options || options.nodupes !== false) {
    return utils.unique(matches);
  }

  return matches;
}

/**
 * Cache
 */

nanomatch.cache = cache;
nanomatch.clearCache = function() {
  nanomatch.cache.__data__ = {};
};

/**
 * Similar to the main function, but `pattern` must be a string.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * console.log(nanomatch.match(['a.a', 'a.aa', 'a.b', 'a.c'], '*.a'));
 * //=> ['a.a', 'a.aa']
 * ```
 * @param {Array} `list` Array of strings to match
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Array} Returns an array of matches
 * @api public
 */

nanomatch.match = function(list, pattern, options) {
  var unixify = utils.unixify(options);
  var isMatch = nanomatch.matcher(pattern, options);

  list = utils.arrayify(list);
  var len = list.length;
  var idx = -1;
  var matches = [];

  while (++idx < len) {
    var ele = list[idx];

    if (ele === pattern) {
      matches.push(unixify(ele));
      continue;
    }

    var unix = unixify(ele);
    if (unix === pattern || isMatch(unix)) {
      matches.push(unix);
    }
  }

  // if no options were passed, uniquify results and return
  if (typeof options === 'undefined') {
    return utils.unique(matches);
  }

  if (matches.length === 0) {
    if (options.failglob === true) {
      throw new Error('no matches found for "' + pattern + '"');
    }
    if (options.nonull === true || options.nullglob === true) {
      return [options.unescape ? utils.unescape(pattern) : pattern];
    }
  }

  // if `opts.ignore` was defined, diff ignored list
  if (options.ignore) {
    matches = nanomatch.not(matches, options.ignore, options);
  }

  return options.nodupes !== false ? utils.unique(matches) : matches;
};

/**
 * Returns true if the specified `string` matches the given glob `pattern`.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * console.log(nanomatch.isMatch('a.a', '*.a'));
 * //=> true
 * console.log(nanomatch.isMatch('a.b', '*.a'));
 * //=> false
 * ```
 * @param {String} `string` String to match
 * @param {String} `pattern` Glob pattern
 * @param {String} `options`
 * @return {Boolean} Returns true if the string matches the glob pattern.
 * @api public
 */

nanomatch.isMatch = function(str, pattern, options) {
  if (pattern === str) {
    return true;
  }

  if (pattern === '' || pattern === ' ' || pattern === '/' || pattern === '.') {
    return str === pattern;
  }

  return nanomatch.matcher(pattern, options)(str);
};

/**
 * Returns a list of strings that do _not_ match any of the given `patterns`.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * console.log(nanomatch.not(['a.a', 'b.b', 'c.c'], '*.a'));
 * //=> ['b.b', 'c.c']
 * ```
 * @param {Array} `list` Array of strings to match.
 * @param {String} `pattern` One or more glob patterns.
 * @param {Object} `options`
 * @return {Array} Returns an array of strings that do not match the given patterns.
 * @api public
 */

nanomatch.not = function(list, patterns, options) {
  var opts = extend({}, options);
  var ignore = opts.ignore;
  delete opts.ignore;

  var unixify = utils.unixify(opts);
  var unixified = list.map(function(fp) {
    return unixify(fp, opts);
  });

  var matches = utils.diff(unixified, nanomatch(unixified, patterns, opts));
  if (ignore) {
    matches = utils.diff(matches, nanomatch(unixified, ignore));
  }

  return opts.nodupes !== false ? utils.unique(matches) : matches;
};

/**
 * Returns true if the given `string` matches any of the given glob `patterns`.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * console.log(nanomatch.any('a.a', ['b.*', '*.a']));
 * //=> true
 * console.log(nanomatch.any('a.a', 'b.*'));
 * //=> false
 * ```
 * @param  {String} `str` The string to test.
 * @param  {String|Array} `patterns` Glob patterns to use.
 * @param  {Object} `options` Options to pass to the `matcher()` function.
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

nanomatch.any = function(str, patterns, options) {
  patterns = utils.arrayify(patterns);
  for (var i = 0; i < patterns.length; i++) {
    if (nanomatch.isMatch(str, patterns[i], options)) {
      return true;
    }
  }
  return false;
};

/**
 * Returns true if the given `string` contains the given pattern. Similar to `.isMatch` but
 * the pattern can match any part of the string.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * console.log(nanomatch.contains('aa/bb/cc', '*b'));
 * //=> true
 * console.log(nanomatch.contains('aa/bb/cc', '*d'));
 * //=> false
 * ```
 * @param {String} `str` The string to match.
 * @param {String} `pattern` Glob pattern to use for matching.
 * @param {Object} `options`
 * @return {Boolean} Returns true if the patter matches any part of `str`.
 * @api public
 */

nanomatch.contains = function(str, pattern, options) {
  if (pattern === '' || pattern === ' ') {
    return pattern === str;
  }

  var opts = extend({}, options, {contains: true});
  opts.strictClose = false;
  opts.strictOpen = false;

  return nanomatch.match(str, pattern, opts).length > 0;
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
 * Filter the keys of the given object with the given `glob` pattern
 * and `options`. Does not attempt to match nested keys. If you need this feature,
 * use [glob-object][] instead.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * var obj = { aa: 'a', ab: 'b', ac: 'c' };
 * console.log(nanomatch.matchKeys(obj, '*b'));
 * //=> { ab: 'b' }
 * ```
 * @param  {Object} `object`
 * @param  {Array|String} `patterns` One or more glob patterns.
 * @return {Object} Returns an object with only keys that match the given patterns.
 * @api public
 */

nanomatch.matchKeys = function(obj, patterns, options) {
  if (!utils.isObject(obj)) {
    throw new TypeError('expected the first argument to be an object');
  }
  var keys = nanomatch(Object.keys(obj), patterns, options);
  return utils.pick(obj, keys);
};

/**
 * Creates a matcher function from the given glob `pattern` and `options`. The returned
 * function takes a string to match as its only argument.
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
 * @return {Function} Returns a matcher function.
 * @api public
 */

nanomatch.matcher = function(pattern, options) {
  function matcher() {
    var unixify = utils.unixify(options);

    // if pattern is a regex
    if (pattern instanceof RegExp) {
      return function(str) {
        return pattern.test(str) || pattern.test(unixify(str));
      };
    }

    // if pattern is invalid
    if (!utils.isString(pattern)) {
      throw new TypeError('expected pattern to be a string or regex');
    }

    // if pattern is a non-glob string
    if (!utils.hasSpecialChars(pattern)) {
      if (options && options.nocase === true) {
        pattern = pattern.toLowerCase();
      }
      return utils.matchPath(pattern, options);
    }

    // if pattern is a glob string
    var re = nanomatch.makeRe(pattern, options);

    // if `options.matchBase` or `options.basename` is defined
    if (nanomatch.matchBase(pattern, options)) {
      return utils.matchBasename(re, options);
    }

    // everything else...
    return function(str) {
      return re.test(str) || re.test(unixify(str));
    };
  }

  return memoize('matcher', pattern, options, matcher);
};

/**
 * Create a regular expression from the given glob `pattern`.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * console.log(nanomatch.makeRe('*.js'));
 * //=> /^(?:(\.[\\\/])?(?!\.)(?=.)[^\/]*?\.js)$/
 * ```
 * @param {String} `pattern` The pattern to convert to regex.
 * @param {Object} `options`
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

nanomatch.makeRe = function(pattern, options) {
  if (pattern instanceof RegExp) {
    return pattern;
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('expected pattern to be a string');
  }

  if (pattern.length > MAX_LENGTH) {
    throw new Error('expected pattern to be less than ' + MAX_LENGTH + ' characters');
  }

  function makeRe() {
    var opts = extend({strictErrors: false}, options);
    if (opts.strictErrors === true) opts.strict = true;
    var res = nanomatch.create(pattern, opts);
    return toRegex(res.output, opts);
  }

  var regex = memoize('makeRe', pattern, options, makeRe);
  if (regex.source.length > MAX_LENGTH) {
    throw new SyntaxError('potentially malicious regex detected');
  }

  return regex;
};

/**
 * Parses the given glob `pattern` and returns an object with the compiled `output`
 * and optional source `map`.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * console.log(nanomatch.create('abc/*.js'));
 * // { options: { source: 'string', sourcemap: true },
 * //   state: {},
 * //   compilers:
 * //    { ... },
 * //   output: '(\\.[\\\\\\/])?abc\\/(?!\\.)(?=.)[^\\/]*?\\.js',
 * //   ast:
 * //    { type: 'root',
 * //      errors: [],
 * //      nodes:
 * //       [ ... ],
 * //      dot: false,
 * //      input: 'abc/*.js' },
 * //   parsingErrors: [],
 * //   map:
 * //    { version: 3,
 * //      sources: [ 'string' ],
 * //      names: [],
 * //      mappings: 'AAAA,GAAG,EAAC,kBAAC,EAAC,EAAE',
 * //      sourcesContent: [ 'abc/*.js' ] },
 * //   position: { line: 1, column: 28 },
 * //   content: {},
 * //   files: {},
 * //   idx: 6 }
 * ```
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Object} Returns an object with the parsed AST, compiled string and optional source map.
 * @api public
 */

nanomatch.create = function(pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('expected a string');
  }

  function create() {
    var snapdragon = (options && options.snapdragon) || new Snapdragon(options);
    compilers(snapdragon);
    parsers(snapdragon);

    if (pattern.slice(0, 2) === './') {
      pattern = pattern.slice(2);
    }

    pattern = utils.combineDuplicates(pattern, '\\*\\*\\/|\\/\\*\\*');
    var ast = snapdragon.parse(pattern, options);
    ast.input = pattern;
    return snapdragon.compile(ast, options);
  }

  return memoize('create', pattern, options, create);
};

/**
 * Memoize a generated regex or function
 */

function memoize(type, pattern, options, fn) {
  var key = utils.createKey(type + pattern, options);

  if (cache.has(type, key)) {
    return cache.get(type, key);
  }

  var val = fn(pattern, options);
  if (options && options.cache === false) {
    return val;
  }

  cache.set(type, key, val);
  return val;
}

/**
 * Expose parser, compiler and constructor on `nanomatch`
 */

nanomatch.compilers = compilers;
nanomatch.parsers = parsers;

/**
 * Expose `nanomatch`
 * @type {Function}
 */

module.exports = nanomatch;
