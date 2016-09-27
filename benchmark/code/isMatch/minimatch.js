var multimatch = require('multimatch');
var minimatch = require('minimatch');

module.exports = function(args) {
  if (Array.isArray(args[1])) {
    return multimatch.apply(null, args).length > 0;
  }
  var re = minimatch.makeRe(args[1]);
  return re.test(args[0]);
};
