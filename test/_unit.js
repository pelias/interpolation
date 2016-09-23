
var tape = require('tape');
var common = {};

var tests = [
  require('./interface.js'),
  require('./lib/analyze.js'),
  require('./lib/project.js')
];

tests.map(function(t) {
  t.all(tape, common);
});
