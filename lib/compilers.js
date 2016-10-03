'use strict';

/**
 * Nanomatch compilers
 */

module.exports = function(nanomatch) {
  var star = '[^/]*?';

  nanomatch.compiler

    /**
     * Negation / escaping
     */

    .set('not', function(node) {
      var val = node.val ? '\\' + node.val : '';
      return this.emit(val, node);
    })
    .set('escape', function(node) {
      var val = /^[-\w_]/.test(node.ch) ? node.ch : node.val;
      return this.emit(val, node);
    })

    /**
     * Regex
     */

    .set('regex', function(node) {
      if (node.val === '^' || node.val === '$') {
        return this.emit('\\' + node.val, node);
      }
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
     * Slashes: "/" and "\"
     */

    .set('slash', function(node) {
      if (node.parsed === '**') {
        this.output = '(' + this.output;
        return this.emit('\\/)?', node);
      }
      return this.emit('\\/', node);
    })
    .set('backslash', function(node) {
      return this.emit('\\\\', node);
    })

    /**
     * Square: "[.]" (only matches a single character in brackets)
     */

    .set('square', function(node) {
      var val = !/^\w/.test(node.val) ? '\\' + node.val : node.val;
      return this.emit(val, node);
    })

    /**
     * Question mark: "?"
     */

    .set('qmark', function(node) {
      var val = this.options.dot ? '[^/\\\\]' : '[^/.\\\\]';
      var prev = this.prev();

      if (prev.type === 'text' && prev.val) {
        return this.emit(val, node);
      }

      if (node.val.length > 1) {
        val = '.{' + node.val.length + '}';
      }

      if (prev.type === 'bos' && !this.options.dot) {
        val = '(?!\\.)' + val;
      }
      return this.emit(val, node);
    })

    /**
     * Plus
     */

    .set('plus', function(node) {
      var prev = node.parsed.slice(-1)
      if (prev === ']' || prev === ')') {
        return this.emit(node.val, node);
      }
      if (!this.output || (/[?*+]/.test(ch) && node.parent.type !== 'bracket')) {
        return this.emit('\\+', node);
      }
      var ch = this.output.slice(-1);
      if (/\w/.test(ch) && !node.inside) {
        return this.emit('+\\+?', node);
      }
      return this.emit('+', node);
    })

    /**
     * globstar: '**'
     */

    .set('globstar', function(node, nodes, i) {
      var prev = this.prev();
      var val = node.val;

      if (prev.type !== 'slash' && prev.type !== 'bos' && node.parsed.slice(-1) !== '!') {
        val = star;
      } else {
        val = this.options.dot !== true
          ? '(?:(?!(?:\\/|^)\\.).)*?'
          : '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
      }

      var before = nodes[i - 2] || {};
      if (prev.type === 'slash' && node.rest.charAt(0) === '/' && before.type !== 'qmark') {
        this.output += '?';
      }

      if ((prev.type === 'slash' || prev.type === 'bos') && this.options.dot !== true) {
        this.output += '(?!\\.)';
      }

      return this.emit(val, node);
    })

    /**
     * Star: "*"
     */

    .set('star', function(node) {
      if (this.output.slice(-1) === ']') {
        return this.emit('*?', node);
      }

      var prev = this.prev();
      var prefix = !this.dot && prev.type !== 'text' && prev.type !== 'escape'
        ? (this.options.dot ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))(?=.)' : '(?!\\.)')
        : '';

      var val = prefix + star;
      var next = this.next();
      if (prev.type !== 'bos' && prev.type !== 'slash' && next.type !== 'eos') {
        val = '(' + val + ')?';
      }

      return this.emit(val, node);
    })

    /**
     * Text
     */

    .set('text', function(node) {
      return this.emit(node.val, node);
    })

    /**
     * end-of-string
     */

    .set('eos', function(node) {
      var util = require('util');
      // console.log(util.inspect(this.ast.nodes, {depth: null}))
      // console.log(this)
      return this.emit(node.val, node);
    });
};
