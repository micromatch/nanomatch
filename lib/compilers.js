'use strict';

var isExtglob = require('is-extglob');

/**
 * Nanomatch compilers
 */

module.exports = function(nanomatch, options) {
  var star = '[^/]*?';

  var ast = nanomatch.ast = nanomatch.parser.ast;
  ast.state = nanomatch.parser.state;
  nanomatch.compiler.state = ast.state;

  nanomatch.compiler

    /**
     * Negation / escaping
     */

    .set('not', function(node) {
      var prev = this.prev();
      if (this.options.nonegate === true || prev.type !== 'bos') {
        return this.emit('\\' + node.val, node);
      }
      return this.emit(node.val, node);
    })
    .set('escape', function(node) {
      if (this.options.unescape && /^[\w_.-]/.test(node.val)) {
        return this.emit(node.val, node);
      }
      return this.emit('\\' + node.val, node);
    })
    .set('quoted', function(node) {
      return this.emit(node.val, node);
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
      var parent = node.parent;
      while (parent.type === 'paren' && !parent.hasSlash) {
        parent.hasSlash = true;
        parent = parent.parent;
      }

      // word boundary
      if (node.rest.slice(0, 2) === '\\b') {
        return this.emit(node.val, node);
      }

      var parsed = node.parsed;
      var val = '\\' + node.val;

      if (parsed === '**' || parsed === './**') {
        this.output = '(^(?=.)|' + this.output;
        return this.emit(val + ')', node);
      }
      if (parsed === '!**' && this.options.nonegate !== true) {
        return this.emit(val + '?\\b', node);
      }
      return this.emit(val, node);
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

      if (node.escaped === true) {
        inner = inner.replace(/\\?(\W)/g, '\\$1');
        negated = '';
      }

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
      var prev = this.prev();
      var val = '[^.\\\\/]';
      if (this.options.dot || (prev.type !== 'bos' && prev.type !== 'slash')) {
        val = '[^\\\\/]';
      }

      if (node.parsed.slice(-1) === '(') {
        var ch = node.rest.charAt(0);
        if (ch === '!' || ch === '=' || ch === ':') {
          return this.emit(node.val, node);
        }
      }

      if (node.val.length > 1) {
        val += '{' + node.val.length + '}';
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
      if (!this.output) this.output = '(?=.)' + this.output;

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
          : '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/))(?!\\.{2}).)*?';
      }

      var prior = nodes[i - 2] || {};
      if (type === 'slash' && this.output !== '\\/' && node.rest.charAt(0) === '/' && prior.type !== 'qmark' && !isExtglob(node.rest)) {
        this.output += '?\\b';
      }

      if ((type === 'slash' || type === 'bos') && this.options.dot !== true) {
        val = '(?!\\.)' + val;
      }

      if (this.output === '\\/' && nodes[i + 1].type !== 'eos') {
        this.output = '(\\/|';
        return this.emit('\\/' + val + ')?(?=.)', node);
      }

      return this.emit(val, node);
    })

    /**
     * Star: "*"
     */

    .set('star', function(node, nodes, i) {
      var prior = nodes[i - 2] || {};
      var prev = this.prev();
      var next = this.next();
      var type = prev.type;

      function isStart(n) {
        return n.type === 'bos' || n.type === 'slash';
      }

      if (this.output === '' && this.options.contains !== true) {
        this.output = '(?!\\/)';
      }

      if (type === 'bracket' && this.options.bash === false) {
        var str = next && next.type === 'bracket' ? star : '*?';
        if (!prev.nodes || prev.nodes[1].type !== 'posix') {
          return this.emit(str, node);
        }
      }

      var prefix = !this.dotfiles && type !== 'text' && type !== 'escape'
        ? (this.options.dot ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))' : '(?!\\.)')
        : '';

      if (isStart(prev) || (isStart(prior) && type === 'not')) {
        if (prefix !== '(?!\\.)') {
          prefix += '(?!(\\.{2}|\\.\\/))(?=.)';
        } else {
          prefix += '(?=.)';
        }
      } else if (prefix === '(?!\\.)') {
        prefix = '';
      }

      if (prev.type === 'not' && prior.type === 'bos' && this.options.dot === true) {
        this.output = '(?!\\.)' + this.output;
      }

      return this.emit(prefix + star, node);
    })

    /**
     * Text
     */

    .set('text', function(node) {
      return this.emit(node.val, node);
    })

    /**
     * End-of-string
     */

    .set('eos', function(node) {
      if (this.output.slice(-2) === '/?' || this.output.slice(-6) === '(\\/|$)') {
        return this.emit(node.val, node);
      }

      var prev = this.prev();
      var val = node.val;
      if (this.state.metachar && prev.type !== 'qmark' && prev.type !== 'slash') {
        val += (this.options.contains ? '\\/?' : '(\\/|$)');
      }

      return this.emit(val, node);
    });

  /**
   * Allow custom compilers to be passed on options
   */

  if (options && typeof options.compilers === 'function') {
    options.compilers(nanomatch.compiler);
  }
};

