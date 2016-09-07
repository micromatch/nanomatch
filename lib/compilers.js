'use strict';

var utils = require('./utils');

module.exports = function(nanomatch) {
  var state = {};
  var star = '[^/]*?';

  nanomatch.compiler

    /**
     * beginning-of-string
     */

    .set('bos', function(node) {
      return this.emit(node.val, node);
    })
    .set('noop', function(node) {
      return this.emit(node.val, node);
    })

    /**
     * Negation / escaping
     */

    .set('not', function(node) {
      return this.emit('', node);
    })
    .set('escape', function(node) {
      if (/^\w/.test(node.val)) {
        return this.emit(node.val);
      }
      return this.emit('\\' + node.val, node);
    })

    /**
     * Text
     */

    .set('text', function(node) {
      return this.emit(node.val, node);
    })

    /**
     * Dot: "."
     */

    .set('dot', function(node) {
      return this.emit('\\' + node.val, node);
    })
    .set('dots', function(node) {
      return this.emit('[.]{2}', node);
    })

    /**
     * Slash: "/"
     */

    .set('slash', function(node) {
      var next = node.rest ? node.rest.charAt(0) : '';
      var val = '\\/';
      if (node.parsed === '**') {
        val += '?';
      }
      return this.emit(val, node);
    })

    /**
     * Square: "[/]"
     */

    .set('square', function(node) {
      var val = /^\w/.test(node.val) ? node.val : '\\' + node.val;
      return this.emit(val, node);
    })

    /**
     * Plus
     */

    .set('plus', function(node) {
      return this.emit('\\' + node.val, node);
    })

    /**
     * Question mark: "?"
     */

    .set('qmark', function(node) {
      var prefix = this.options.dot ? '[^/]' : '[^/.]';
      var prev = this.prev();

      if (prev.type === 'text' && prev.val) {
        return this.emit(node.val, node);
      }

      var val = prefix + '{' + node.val.length + '}';
      if (prev.type === 'bos' && !this.options.dot) {
        val = '(?!\\.)' + val;
      }
      return this.emit(val, node);
    })

    /**
     * globstar: '**'
     */

    .set('globstar', function(node) {
      var prevCh = this.output[this.output.length - 1];
      var nextCh = node.rest.charAt(0);
      var prev = this.prev();
      var val = node.val;

      if (prev.type !== 'slash' && prev.type !== 'bos') {
        val = star;
      } else {
        val = !this.options.dot
          ? '(?:(?!(?:\\/|^)\\.).)*?'
          : '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
      }

      if (prevCh === '/' && nextCh === '/') {
        this.output += '?';
      }

      return this.emit(val, node);
    })

    /**
     * Star: "*"
     */

    .set('star', function(node) {
      var prevCh = this.output[this.output.length - 1];
      var nextCh = node.rest.charAt(0);
      var isAlpha = prevCh && /[\w.]/.test(prevCh) && nextCh && /[\w.]/.test(nextCh);

      var prefix = !this.dot && !isAlpha && node.rest
        ? (this.options.dot ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))(?=.)' : '(?!\\.)')
        : '';

      return this.emit(prefix + star, node);
    })

    /**
     * Misc
     */

    .set('dollar', function(node) {
      return this.emit('\\' + node.val, node);
    })
    .set('colon', function(node) {
      return this.emit(node.val, node);
    })

    /**
     * end-of-string
     */

    .set('eos', function(node) {
      return this.emit(node.val, node);
    });
};
