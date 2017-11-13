
const tape = require('tape');
const common = {};

const tests = [
  require('./interface.js'),
  require('./lib/analyze.js'),
  require('./lib/proximity.js'),
  require('./lib/project.js'),
  require('./lib/interpolate.js'),
  require('./lib/Street.js'),
  require('./lib/Address.js'),
  require('./stream/split.js'),
  require('./stream/oa/convert.js'),
  require('./stream/osm/convert.js'),
  require('./stream/osm/delimited_ranges.js'),
  require('./query/search.js'),
  require('./api/search.js')
];

tests.map(function(t) {
  t.all(tape, common);
});
