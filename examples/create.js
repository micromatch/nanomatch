'use strict';

var nanomatch = require('..');
var pattern = '*.js';

var res = nanomatch.create(pattern);
console.log(res);
