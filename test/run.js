
var tape = require('tape');
var common = {};

var tests = [
  require('./interface.js')
];

tests.map(function(t) {
  t.all(tape, common);
});
