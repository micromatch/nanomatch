'use strict';

var utils = require('./utils');
var str = '[!*+?$^/.\\\\]+';
var not = new RegExp(utils.not(str));

/**
 * Nanomatch parsers
 */

module.exports = function(nanomatch) {
  nanomatch.parser

    /**
     * Character parsers
     */

    .capture('dot', /^\./)
    .capture('plus', /^\+/)
    .capture('slash', /^\//)
    .capture('escape', function() {
      var pos = this.position();
      var m = this.match(/^\\([^\w])/);
      if (!m) return;
      return pos({
        type: 'escape',
        val: m[0],
        ch: m[1]
      });
    })
    .capture('backslash', /^\\(?=\w)/)
    .capture('qmark', /^\?+/)
    .capture('globstar', /^\*{2}(?=\/|$)/)
    .capture('star', /^(?:\*(?!\*)|[*]{3,}|[*]{2}(?!\/|$))/)
    .capture('square', function() {
      var pos = this.position();
      var m = this.match(/^\[(?![\^!\[\]])(.)\]/);
      if (!m) return;

      return pos({
        type: 'square',
        val: m[1]
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

      var prev = this.prev();
      var node = pos({
        type: 'not',
        val: !this.options.nonegate ? m[0] : ''
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

    .capture('regex', function() {
      var pos = this.position();
      var m = this.match(/^[$^]/);
      if (!m) return;

      return pos({
        type: 'regex',
        val: m[0]
      });
    });
};

/**
 * Expose negation string
 */

module.exports.not = str;
