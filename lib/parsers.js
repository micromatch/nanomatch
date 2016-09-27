'use strict';

var utils = require('./utils');

module.exports = function(nanomatch) {
  nanomatch.parser

    /**
     * Character parsers
     */

    .capture('dot', /^\./)
    .capture('plus', /^\+/)
    .capture('slash', /^\//)
    .capture('escape', /^\\(.)/)
    .capture('backslash', /^\\(?:\\)/)
    .capture('qmark', /^\?+/)
    .capture('globstar', /^\*{2}(?![*])/)
    .capture('star', /^(?:\*(?!\*)|[*]{3,})/)
    .capture('square', function() {
      var pos = this.position();
      var m = this.match(/^\[(?![\^!\[])(.)\]/);
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
        val: m[0]
      });

      // if nothing has been parsed, we know `!` is at the start,
      // so we need to wrap the result in a negation regex
      if (!parsed) {
        this.bos.val = '(?!^(?:';
        this.append = ')$).*';
        node.val = '';
      }

      utils.define(node, 'parent', prev);
      prev.nodes.push(node);
      return node;
    })

    /**
     * Text
     */

    .capture('text', function() {
      var pos = this.position();
      var re = new RegExp(utils.not('[!*+?$^/.\\\\]+'));
      var m = this.match(re);
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
    })
};
