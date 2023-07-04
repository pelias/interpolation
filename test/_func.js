
var tape = require('tape');

var common = {
  // fuzzy rewrites SQL table dumps to reduce floating point precision to max 8
  truncate: (s) => s.match(/^-?[0-9]+\.[0-9]+$/) ? s.split('.').map(c => c.substring(0, 8)).join('.') : s,
  fuzzy: (row) => row.split('|').map(common.truncate).join('|'),
};

var tests = [
  require('./functional/basic/run.js'),
  require('./functional/disjoined/run.js'),
  require('./functional/west26th/run.js'),
  require('./functional/updown/run.js'),
  require('./functional/ambiguous_street_name/run.js'),
  require('./functional/potsdamerplatz/run.js'),
  require('./functional/willow_ave/run.js'),
  require('./functional/nevern_square/run.js'),
  require('./functional/lueppold_rd/run.js')
];

tests.map(function(t) {
  t.all(tape, common);
});
