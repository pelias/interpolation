
var tape = require('tape');
var common = {};

var tests = [
  require('./interface.js'),
  require('./lib/analyze.js'),
  require('./functional/basic/run.js'),
  require('./functional/disjoined/run.js')
];

tests.map(function(t) {
  t.all(tape, common);
});
