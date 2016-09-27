var mm = require('..');
console.log(mm.not(['z.js', 'a.js'], '**/z*'));
console.log(mm.not(['a/a/a', 'a/a/b', 'b/b/a', , 'b/b/b', 'c/c/a', 'c/c/b', 'c/c/c'], '**/a', {ignore: ['**/c']}));
