'use strict';

var path = require('path');
var util = require('util');
var cyan = require('ansi-cyan');
var argv = require('yargs-parser')(process.argv.slice(2));
var isPrimitive = require('is-primitive');
var isObject = require('is-object');
var Suite = require('benchmarked');

function run(type, pattern) {
  var suite = new Suite({
    cwd: __dirname,
    fixtures: path.join('fixtures', type, '*.js'),
    code: path.join('code', type, '*.js')
  });

  if (argv.dry) {
    console.log(type);
    suite.dryRun(function(code, fixture) {
      console.log(cyan('%s > %s'), code.key, fixture.key);
      var args = require(fixture.path);
      var last = [];
      if (args.length > 2) {
        last = args.pop();
      }
      var expected = util.inspect(last, {depth: null});
      console.log(util.inspect(code.run.apply(null, args), {depth: null}));
      console.log();
    });
  } else {
    suite.run();
  }
}

run(argv._[0] || 'match');
