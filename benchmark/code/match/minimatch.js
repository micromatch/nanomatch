var multimatch = require('multimatch');
var minimatch = require('minimatch');

module.exports = function(files, pattern) {
  if (Array.isArray(pattern)) {
    return multimatch.apply(multimatch, arguments);
  }
  return minimatch.match.apply(minimatch, arguments);
};
