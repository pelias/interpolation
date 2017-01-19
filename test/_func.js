
var tape = require('tape');
var common = {};

var tests = [
  require('./functional/basic/run.js'),
  require('./functional/disjoined/run.js'),
  require('./functional/west26th/run.js'),
  require('./functional/updown/run.js'),
  require('./functional/ambiguous_street_name/run.js'),
  require('./functional/potsdamerplatz/run.js'),
  require('./functional/willow_ave/run.js'),
  require('./functional/nevern_square/run.js'),
  require('./functional/cemetery_rd/run.js'),
];

tests.map(function(t) {
  t.all(tape, common);
});
