module.exports = [
  // common file patterns
  'abc',
  'abd',
  'abbbz',
  'a',
  'a.md',
  'a/b/c.md',

  'z.js',
  'za.js',
  'a/b/c/z.js',
  'a/b/c/d/e/f/z.js',

  // directories
  'a/',
  'a/b',
  'a/cb',
  'a/bb',
  'a/b/c/d',
  'a/b/c/d/',

  // cwd
  '.',
  './',

  // ancestor directories
  '..',
  '../c',
  '../c',
  './../c',
  '/..',
  '/../c',

  // bad paths
  './a/../c',
  '/a/../c',
  'a/../c',

  // dot files
  './.b/.c',
  './b/.c',
  '../.b/.c',
  '../b/.c',
  '.b',
  '.b/',
  '.b',
  '.b.c',
  '.b.c/',
  '.b/',
  '.b/c',
  'b/.c',

  // dot directories
  'b/.c/',
  '.b/.c',
];
