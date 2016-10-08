var nm = require('..');
console.log(nm.create('abc/*.js', {sourcemap: true}));
// {
//   output: '(\\.[\\\\\\/])?(?!\\.)(?=.)[^\\/]*?(([^\\/]*?)?(of([^\\/]*?)?(a)x)z)',
//   map: {
//     version: 3,
//     sources: ['string'],
//     names: [],
//     mappings: 'AAAA,kBAAC,CAAC,UAAC,GAAG,UAAC,OAAO',
//     sourcesContent: ['*(*(of*(a)x)z)']
//   }
// }
