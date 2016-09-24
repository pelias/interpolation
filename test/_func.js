
var tape = require('tape');
var common = {};

var tests = [
  require('./functional/basic/run.js'),
  require('./functional/disjoined/run.js'),
  require('./functional/west26th/run.js')
];

tests.map(function(t) {
  t.all(tape, common);
});
