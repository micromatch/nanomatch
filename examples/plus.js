var nm = require('..');
var arr = ['Microsoft Visual C++ 2013 x86 Additional Runtime - 12.0.21005'];

console.log(nm.match(arr, '*Microsoft Visual C++*'));
console.log(nm.match(arr, 'Microsoft Visual C++*'));
console.log(nm.match(arr, 'Microsoft Visual C+++')); // should not match
console.log(nm.match(['ffoo', 'bbar', 'bbaz'], '(b|f)+*'));
console.log(nm.match(['ffoo', 'bbar', 'bbaz'], '(b|f)**'));
console.log(nm.match(['ffoo', 'bbar', 'bbaz'], '*(b|f)*'));
console.log(nm.match(['ffoo', 'bbar', 'bbaz'], '+(b|f)*')); // nothing
console.log(nm.match(['+foo', '+bar', '+baz'], '+(b|f)*')); // all match
console.log(nm.makeRe('+(b|f)*'));
console.log(nm.makeRe('*(b|f)*'));
