
var tape = require('tape');
var common = {};

var tests = [
  require('./interface.js'),
  require('./lib/analyze.js'),
  require('./lib/proximity.js'),
  require('./lib/project.js'),
  require('./lib/interpolate.js'),
  require('./lib/Street.js'),
  require('./lib/Address.js')
];

tests.map(function(t) {
  t.all(tape, common);
});
