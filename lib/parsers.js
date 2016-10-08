'use strict';

var regex = require('regex-not');
var isOdd = require('is-odd');

/**
 * Negation regex cache
 */

var cache = {};

/**
 * Characters to use in negation regex (we want to "not" match
 * characters that are matched by other parsers)
 */

var NOT_REGEX = '[!*+?$\\[/.\\\\]+';

/**
 * Regex
 */

var not = createRegex(NOT_REGEX);

/**
 * Nanomatch parsers
 */

module.exports = function(nanomatch) {
  nanomatch.parser

    /**
     * Beginning-of-string
     */

    .capture('bos', function() {
      if (this.parsed) return;
      var pos = this.position();
      var m = this.match(/^\.[\\/]/);
      if (!m) return;

      var val = '\\.\\/';
      var strict = true;

      if (this.options.strictOpen === false) {
        val = '(\\.\\/|^)';
        strict = false;
      }

      this.ast.strictOpen = strict;
      return pos({
        type: 'bos',
        val: val
      });
    })

    /**
     * Escape: "\\."
     */

    .capture('escape', function() {
      var pos = this.position();
      var m = this.match(/^\\(.)/);
      if (!m) return;

      var ch = !/[*?+]/.test(m[1]) ? m[1] : m[0];
      return pos({
        type: 'escape',
        val: m[0],
        ch: ch
      });
    })

    /**
     * Negations: "!"
     */

    .capture('not', function() {
      var parsed = this.parsed;
      var pos = this.position();
      var m = this.match(/^\!+/);
      if (!m) return;

      var val = m[0];
      var isNegated = isOdd(val.length);
      if (parsed === '' && !isNegated) {
        val = '';
      }

      var node = pos({
        type: 'not',
        val: val
      });

      // if nothing has been parsed, we know `!` is at the start,
      // so we need to wrap the result in a negation regex
      if (parsed === '' && isNegated && !this.options.nonegate) {
        this.bos.val = '(?!^(?:';
        this.append = ')$).*';
        node.val = '';
      }
      return node;
    })

    /**
     * Dot: "."
     */

    .capture('dot', function() {
      var parsed = this.parsed;
      var pos = this.position();
      var m = this.match(/^\.+/);
      if (!m) return;

      var val = m[0];
      this.ast.dot = val === '.' && (parsed === '' || parsed.slice(-1) === '/');

      return pos({
        type: 'dot',
        dotfiles: this.ast.dot,
        val: val
      });
    })

    .capture('plus', /^\+/)
    .capture('qmark', /^\?+/)
    .capture('globstar', function() {
      var pos = this.position();
      var m = this.match(/^\*{2}(?!\*)(?=\/|$)/);
      if (!m) return;

      while (this.input.slice(0, 4) === '/**/') {
        this.input = this.input.slice(4);
      }

      return pos({
        type: 'globstar',
        val: '**'
      });
    })
    .capture('star', /^(?:\*(?!\*)|[*]{3,}|[*]{2}(?!\/|$))/)
    .capture('slash', /^\//)
    .capture('square', function() {
      var pos = this.position();
      var m = this.match(/^\[(?![\^!])(.)\]/);
      if (!m) return;

      return pos({
        type: 'square',
        val: m[1]
      });
    })

    /**
     * Brackets: "[...]" (can be overridden by parsers in expand-brackets)
     */

    .capture('bracket', function() {
      var pos = this.position();
      var m = this.match(/^(?:\[([!^]?)([^\]]{2,}|\]\-)(\]|[^*+?]+)|\[)/);
      if (!m) return;

      var val = m[0];
      var prefix = m[1] ? '^' : '';
      var inner = m[2] || '';
      var close = m[3] || '';

      return pos({
        type: 'bracket',
        val: val,
        escaped: close !== ']',
        prefix: prefix,
        inner: inner,
        close: close
      });
    })

    /**
     * Dollar: "$"
     */

    .capture('dollar', function() {
      var pos = this.position();
      var m = this.match(/^[$]/);
      if (!m) return;

      return pos({
        type: 'dollar',
        val: m[0]
      });
    })

    /**
     * Text
     */

    .capture('text', function() {
      var pos = this.position();
      var m = this.match(not);
      if (!m || !m[0]) return;

      return pos({
        type: 'text',
        val: m[0]
      });
    });

};

/**
 * Create and cache negation regex
 */

function createRegex(str) {
  if (cache.hasOwnProperty(str)) {
    return cache[str];
  }
  var opts = {contains: true, strictClose: false};
  var re = regex(str, opts);
  cache[str] = re;
  return re;
}

/**
 * Expose negation string
 */

module.exports.not = NOT_REGEX;
