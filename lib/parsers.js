'use strict';

var utils = require('./utils');

module.exports = function(nanomatch) {

  nanomatch.parser

    /**
     * Character parsers
     */

    .capture('dot', /^\./)
    .capture('plus', /^\+(?!\()/)
    .capture('slash', /^\//)
    .capture('qmark', /^\?+(?!\()/)
    .capture('globstar', /^\*{2}(?![*(])/)
    .capture('star', /^(?:\*(?![*(])|[*]{3,})/)
    .set('square', function() {
      var pos = this.position();
      var m = this.match(/^\[(?![\[\^])(.)\]/);
      if (!m) return;

      return pos({
        type: 'square',
        val: m[1]
      });
    })

    /**
     * Parse negations
     */

    .set('not', function() {
      var parsed = this.parsed;
      var pos = this.position();
      var m = this.match(/^\!/);
      if (!m || !m[0]) return;

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

    .set('text', function() {
      var pos = this.position();
      var m = this.match(/^[-\[({})\]$^`%&;#~=\d\w|,]+/);
      if (!m || !m[0]) return;

      return pos({
        type: 'text',
        val: m[0]
      });
    });
};
