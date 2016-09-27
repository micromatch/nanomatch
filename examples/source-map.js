'use strict';

var nanomatch = require('..');
var pattern = '*(*(of*(a)x)z)';

var res = nanomatch(pattern, {sourcemap: true});
console.log(res);
