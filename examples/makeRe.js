var nm = require('..');
console.log(nm.makeRe('*.js'));
//=> /^(?:(\.[\\\/])?(?!\.)(?=.)[^\/]*?\.js)$/
