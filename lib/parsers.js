'use strict';

var utils = require('./utils');
var str = '[!*+?$\\[/.\\\\]+';
var not = new RegExp(utils.not(str));

/**
 * Nanomatch parsers
 */

module.exports = function(nanomatch) {
  nanomatch.parser

    /**
     * Character parsers
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
    .capture('dot', function() {
      var parsed = this.parsed;
      var pos = this.position();
      var m = this.match(/^\./);
      if (!m) return;

      this.ast.dot = parsed === '' || parsed.slice(-1) === '/';

      return pos({
        type: 'dot',
        dotfiles: this.ast.dot,
        val: m[0]
      });
    })
    .capture('backslash', /^\\(?=\w|$)/)
    .capture('plus', /^\+/)
    .capture('slash', /^\//)
    .capture('qmark', /^\?+/)
    .capture('globstar', /^\*{2}(?=\/|$)/)
    .capture('star', /^(?:\*(?!\*)|[*]{3,}|[*]{2}(?!\/|$))/)
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
     * Negations
     */

    .capture('not', function() {
      var parsed = this.parsed;
      var pos = this.position();
      var m = this.match(/^\!/);
      if (!m) return;

      var node = pos({
        type: 'not',
        val: m[0]
      });

      // if nothing has been parsed, we know `!` is at the start,
      // so we need to wrap the result in a negation regex
      if (!parsed && !this.options.nonegate) {
        this.bos.val = '(?!^(?:';
        this.append = ')$).*';
        node.val = '';
      }
      return node;
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
    })

    /**
     * Text
     */

    .capture('dollar', function() {
      var pos = this.position();
      var m = this.match(/^[$]/);
      if (!m) return;

      return pos({
        type: 'dollar',
        val: m[0]
      });
    });
};

/**
 * Expose negation string
 */

module.exports.not = str;
