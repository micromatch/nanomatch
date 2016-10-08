'use strict';

var path = require('path');
var toRegex = require('to-regex');
var Snapdragon = require('snapdragon');
var debug = require('debug')('nanomatch');
var compilers = require('./lib/compilers');
var parsers = require('./lib/parsers');
var utils = require('./lib/utils');
var cache = require('./lib/cache');
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

  var opts = utils.extend({}, options);
  var negated = false;
  var omit = [];
  var keep = [];
  var idx = -1;

  while (++idx < len) {
    var pattern = patterns[idx];

    if (typeof pattern === 'string' && pattern.charCodeAt(0) === 33 /* ! */) {
      omit.push.apply(omit, nanomatch.match(list, pattern.slice(1), opts));
      negated = true;
    } else {
      keep.push.apply(keep, nanomatch.match(list, pattern, opts));
    }
  }

  // minimatch.match parity
  if (negated && keep.length === 0) {
    keep = list;
  }

  var matches = utils.diff(keep, omit);
  return opts.nodupes !== false ? utils.unique(matches) : matches;
}

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
  debug('match <%s>', pattern);

  list = utils.arrayify(list);
  var unixify = utils.unixify(options);
  var isMatch = memoize('match', pattern, options, nanomatch.matcher);
  var matches = [];
  var len = list.length;
  var idx = -1;

  while (++idx < len) {
    var file = list[idx];

    if (file === pattern) {
      matches.push(file);
      continue;
    }

    var unix = unixify(file);
    if (unix === pattern) {
      matches.push(options && options.unixify ? unix : file);
      continue;
    }

    if (isMatch(unix)) {
      matches.push(options && options.unixify ? unix : file);
    }
  }

  // if not options were passed, return now
  if (typeof options === 'undefined') {
    return utils.unique(matches);
  }

  var opts = utils.extend({}, options);
  if (matches.length === 0) {
    if (opts.failglob === true) {
      throw new Error('no matches found for "' + pattern + '"');
    }
    if (opts.nonull === true || opts.nullglob === true) {
      return [opts.unescape ? utils.unescape(pattern) : pattern];
    }
  }

  // if `opts.ignore` was defined, diff ignored list
  if (opts.ignore) {
    matches = nanomatch.not(matches, opts.ignore, opts);
  }

  return opts.nodupes !== false ? utils.unique(matches) : matches;
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
    if (typeof pattern === 'function') {
      return pattern;
    }

    var opts = utils.extend({}, options);
    var unixify = utils.unixify(opts);

    // pattern is a regex
    if (pattern instanceof RegExp) {
      return function(fp) {
        return pattern.test(unixify(fp));
      };
    }

    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string, regex or function');
    }

    // pattern is a non-glob string
    if (!utils.hasSpecialChars(pattern)) {
      return utils.matchPath(unixify(pattern), opts);
    }

    // pattern is a glob string
    var re = nanomatch.makeRe(pattern, options);

    // `options.matchBase` or `options.basename` is defined
    if (nanomatch.matchBase(pattern, options)) {
      return utils.matchBasename(re);
    }

    // everything else...
    return function(fp) {
      return re.test(unixify(fp));
    };
  }

  return memoize('matcher', pattern, options, matcher);
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
  if (typeof str === 'undefined') {
    throw new TypeError('expected a string');
  }

  if (typeof pattern === 'undefined') {
    throw new TypeError('expected pattern to be a string, regex or function');
  }

  if (pattern === '' || pattern === ' ') {
    return str === pattern;
  }

  if (options && nanomatch.matchBase(pattern, options)) {
    str = path.basename(str);
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
  var opts = utils.extend({}, options);
  var ignore = opts.ignore;
  delete opts.ignore;

  var matches = utils.diff(list.slice(), nanomatch(list, patterns, opts));
  if (ignore) {
    return utils.diff(matches, nanomatch(list, ignore));
  }

  return matches;
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
  if (typeof patterns === 'string') {
    patterns = [patterns];
  }

  if (!Array.isArray(patterns)) {
    throw new TypeError('expected patterns to be a string or array');
  }

  debug('match <%s>', patterns);
  var unixify = utils.unixify(opts);
  var opts = utils.extend({}, options);

  str = unixify(str);
  var len = patterns.length;

  for (var i = 0; i < len; i++) {
    var pattern = patterns[i];
    if (!utils.isGlob(pattern)) {
      if (str === pattern) {
        return true;
      }
      if (opts.contains && str.indexOf(pattern) !== -1) {
        return true;
      }
      continue;
    }
    if (nanomatch.isMatch(str, pattern, opts)) {
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
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('expected pattern to be a string');
  }

  var opts = utils.extend({contains: pattern !== ''}, options);
  opts.strictClose = false;
  opts.strictOpen = false;

  if (opts.contains && !utils.isGlob(pattern)) {
    str = utils.unixify(opts)(str);
    return str.indexOf(pattern) !== -1;
  }

  return nanomatch.matcher(pattern, opts)(str);
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

  if (pattern.length > MAX_LENGTH) {
    throw new Error('expected pattern to be less than ' + MAX_LENGTH + ' characters');
  }

  function makeRe() {
    var res = nanomatch.create(pattern, options);
    var opts = utils.extend({strictErrors: false, wrap: false}, options);
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
  debug('nanomatch.create <%s>', pattern);
  options = options || {};

  var snapdragon = options.snapdragon || new Snapdragon(options);
  compilers(snapdragon);
  parsers(snapdragon);

  var ast = snapdragon.parse(pattern, options);
  ast.input = pattern;
  var res = snapdragon.compile(ast, options);
  return res;
};

/**
 * Memoize a generated regex or function
 */

function memoize(type, pattern, options, fn) {
  if (!utils.isString(pattern)) {
    return fn(pattern, options);
  }

  var key = createKey(pattern, options);
  if (cache.has(type, key)) {
    return cache.get(type, key);
  }

  var val = fn(pattern, options);
  if (options && options.cache === false) {
    return val;
  }

  val.key = key;
  cache.set(type, key, val);
  return val;
}

/**
 * Create the key to use for memoization. The key is generated
 * by iterating over the options and concatenating key-value pairs
 * to the pattern string.
 */

function createKey(pattern, options) {
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
