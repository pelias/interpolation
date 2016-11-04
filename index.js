
var requireDir = require('require-dir');

module.exports = {
  api: requireDir('./lib', { recurse: true }),
  lib: requireDir('./lib', { recurse: true }),
  query: requireDir('./query', { recurse: true }),
  stream: requireDir('./stream', { recurse: true })
};
