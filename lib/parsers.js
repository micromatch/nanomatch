'use strict';

var regexNot = require('regex-not');
var toRegex = require('to-regex');
var isOdd = require('is-odd');

/**
 * Characters to use in negation regex (we want to "not" match
 * characters that are matched by other parsers)
 */

var cached;
var NOT_REGEX = '[!*+?$^.\\\\/\\[]+';
var not = createTextRegex(NOT_REGEX);

/**
 * Nanomatch parsers
 */

module.exports = function(nanomatch) {
  nanomatch.state = nanomatch.state || {};
  nanomatch.parser

    /**
     * Beginning-of-string
     */

    .capture('bos', function() {
      if (this.parsed) return;
      var pos = this.position();
      var m = this.match(/^\.[\\/]/);
      if (!m) return;

      this.ast.strictOpen = !!this.options.strictOpen;
      this.ast.addPrefix = true;

      return pos({
        type: 'bos',
        val: ''
      });
    })

    /**
     * Escape: "\\."
     */

    .capture('escape', function() {
      if (this.isInside('bracket')) return;
      var pos = this.position();
      var m = this.match(/^(?:\\(.)|([$^]))/);
      if (!m) return;

      return pos({
        type: 'escape',
        val: m[2] || m[1]
      });
    })

    /**
     * Negations: "!"
     */

    .capture('not', function() {
      var parsed = this.parsed;
      var pos = this.position();
      var m = this.match(this.notRegex || /^\!+/);
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

    /**
     * Plus: "+"
     */

    .capture('plus', /^\+(?!\()/)

    /**
     * Question mark: "?"
     */

    .capture('qmark', function() {
      var parsed = this.parsed;
      var pos = this.position();
      var m = this.match(/^\?+(?!\()/);
      if (!m) return;
      nanomatch.state.metachar = true;
      return pos({
        type: 'qmark',
        parsed: parsed,
        val: m[0]
      });
    })

    /**
     * Globstar: "**"
     */

    .capture('globstar', function() {
      var pos = this.position();
      var m = this.match(/^\*{2}(?![*(])(?=[,\/)]|$)/);
      if (!m) return;

      nanomatch.state.metachar = true;
      return pos({
        type: 'globstar',
        val: '**'
      });
    })

    /**
     * Star: "*"
     */

    .capture('star', function() {
      var pos = this.position();
      var m = this.match(/^(?:\*(?![*(])|[*]{3,}(?!\()|[*]{2}(?![(\/]|$)|\*(?=\*\())/);
      if (!m) return;

      nanomatch.state.metachar = true;
      return pos({
        type: 'star',
        val: m[0]
      });
    })

    /**
     * Slash: "/"
     */

    .capture('slash', /^\//)

    /**
     * Backslash: "\\"
     */

    .capture('backslash', function() {
      if (this.isInside('bracket')) return;
      var pos = this.position();
      var m = this.match(/^\\(?![*+?(){}\[\]])/);
      if (!m) return;

      var match = /^\\{2,}/.exec(this.input);
      var val = m[0];

      if (match) {
        this.consume(match[0].length);
        val += '\\';
      }

      return pos({
        type: 'backslash',
        val: val
      });
    })

    /**
     * Square: "[.]"
     */

    .capture('square', function() {
      if (this.isInside('bracket')) return;
      var pos = this.position();
      var m = this.match(/^\[((?!\\)[^!^])\]/);
      if (!m) return;

      return pos({
        type: 'square',
        val: m[1]
      });
    })

    /**
     * Brackets: "[...]" (basic, this can be overridden by other parsers)
     */

    .capture('bracket', function() {
      var pos = this.position();
      var m = this.match(/^(?:\[([!^]?)([^\]]{2,}|\]\-)(\]|[^*+?]+)|\[)/);
      if (!m) return;

      var val = m[0];
      var negated = m[1] ? '^' : '';
      var inner = m[2] || '';
      var close = m[3] || '';

      var esc = this.input.slice(0, 2);
      if (inner === '' && esc === '\\]') {
        inner += esc;
        this.consume(2);

        var str = this.input;
        var idx = -1;
        var ch;

        while ((ch = str[++idx])) {
          this.consume(1);
          if (ch === ']') {
            close = ch;
            break;
          }
          inner += ch;
        }
      }

      return pos({
        type: 'bracket',
        val: val,
        escaped: close !== ']',
        negated: negated,
        inner: inner,
        close: close
      });
    })

    /**
     * Text
     */

    .capture('text', function() {
      if (this.isInside('bracket')) return;
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
 * Create text regex
 */

function createTextRegex(pattern) {
  if (cached) return cached;
  var opts = {contains: true, strictClose: false};
  var not = regexNot.create(pattern, opts);
  var re = toRegex('^(?:[*]\\(|' + not + ')', opts);
  return (cached = re);
}

/**
 * Expose negation string
 */

module.exports.not = NOT_REGEX;
