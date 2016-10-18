'use strict';

/**
 * Nanomatch compilers
 */

module.exports = function(nanomatch) {
  var star = '[^\\\\/]*?';

  nanomatch.state = nanomatch.state || {};
  nanomatch.compiler

    /**
     * Negation / escaping
     */

    .set('not', function(node) {
      if (this.options.nonegate) {
        return this.emit('\\' + node.val, node);
      }
      return this.emit(node.val, node);
    })
    .set('escape', function(node) {
      if (this.options.unescape && /[\w_.-]/.test(node.val)) {
        return this.emit(node.val, node);
      }
      return this.emit('\\' + node.val, node);
    })

    /**
     * Regex
     */

    .set('dollar', function(node) {
      if (node.parent.type === 'bracket') {
        return this.emit(node.val, node);
      }
      return this.emit('\\' + node.val, node);
    })

    /**
     * Dot: "."
     */

    .set('dot', function(node) {
      if (node.dotfiles === true) this.dotfiles = true;
      return this.emit('\\' + node.val, node);
    })

    /**
     * Slashes: "/" and "\"
     */

    .set('backslash', function(node) {
      return this.emit(node.val, node);
    })
    .set('slash', function(node, nodes, i) {
      // word boundary
      if (node.rest.slice(0, 2) === '\\b') {
        return this.emit(node.val, node);
      }
      if (node.parsed === '**' || node.parsed === './**') {
        this.output = '(' + this.output;
        return this.emit('\\/)*', node);
      }
      if (node.parsed === '!**') {
        return this.emit('\\/*', node);
      }
      return this.emit('\\/', node);
    })

    /**
     * Square brackets
     */

    .set('bracket', function(node) {
      var close = node.close;
      var open = !node.escaped ? '[' : '\\[';
      var negated = node.negated;
      var inner = node.inner;
      var val = node.val;

      inner = inner.replace(/\\(?=[\\\w]|$)/g, '\\\\');
      if (inner === ']-') {
        inner = '\\]\\-';
      }

      if (negated && inner.indexOf('.') === -1) {
        inner += '.';
      }
      if (negated && inner.indexOf('/') === -1) {
        inner += '/';
      }

      val = open + negated + inner + close;
      return this.emit(val, node);
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
      var val = this.options.dot ? '[^\\\\/]' : '[^.\\\\/]';
      var prev = this.prev();

      if (node.parsed.slice(-1) === '(') {
        var ch = node.rest.charAt(0);
        if (ch !== '!' && ch !== '=' && ch !== ':') {
          return this.emit(val, node);
        }
        return this.emit(node.val, node);
      }

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
      var prev = node.parsed.slice(-1);
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
      var type = prev.type;
      var val = node.val;

      var parsed = node.parsed;
      if (parsed.charAt(0) === '!') {
        parsed = parsed.slice(1);
      }

      if (parsed && type !== 'slash' && type !== 'bos') {
        val = star;
      } else {
        val = this.options.dot !== true
          ? '(?:(?!(?:\\/|^)\\.).)*?'
          : '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
      }

      var prior = nodes[i - 2] || {};
      if (type === 'slash' && node.rest.charAt(0) === '/' && prior.type !== 'qmark') {
        this.output += '?';
      }

      if ((type === 'slash' || type === 'bos') && this.options.dot !== true) {
        this.output += '(?!\\.)';
      }

      return this.emit(val, node);
    })

    /**
     * Star: "*"
     */

    .set('star', function(node) {
      var prev = this.prev();
      var next = this.next();
      var type = prev.type;

      var isBracket = this.output.slice(-1) === ']'
        && prev.type === 'bracket'
        && prev.escaped !== true
        && next.type === 'eos';

      if (isBracket) {
        return this.emit('*?', node);
      }

      var prefix = !this.dotfiles && type !== 'text' && type !== 'escape'
        ? (this.options.dot ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))(?=.)' : '(?!\\.)')
        : '';

      var isStart = type === 'slash' || type === 'bos';
      if (prefix !== '(?!\\.)' && isStart && type !== 'dot') {
        prefix += '(?!\\.([./]|$))';
      }

      if (prefix.indexOf('(?=.)') === -1 && isStart) {
        prefix += '(?=.)';
      }

      var val = prefix + star;
      if (!isStart && next.type !== 'eos') {
        val = '(' + val + ')?';
      }

      if (node.rest === '') {
        val += '\\/?';
      }
      return this.emit(val, node);
    })

    /**
     * Text
     */

    .set('text', function(node) {
      var val = node.val;
      if (node.rest === '' && nanomatch.state.metachar) {
        val += '\\/?';
      }
      return this.emit(val, node);
    });
};

