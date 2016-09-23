
var requireDir = require('require-dir');

module.exports = {
  lib: requireDir('./lib', { recurse: true }),
  query: requireDir('./query', { recurse: true }),
  stream: requireDir('./stream', { recurse: true })
};
