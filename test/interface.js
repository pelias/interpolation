
var index = require('../index');

module.exports.interface = {};

module.exports.interface.defaults = function(test) {
  test('defaults', function(t) {
    t.equal(typeof index, 'object', 'valid object');
    t.equal(typeof index.stream, 'object', 'valid object');
    t.equal(typeof index.query, 'object', 'valid object');
    t.equal(typeof index.lib, 'object', 'valid object');
    t.end();
  });
};

module.exports.interface.stream = function(test) {
  test('streams general', function(t) {
    t.equal(typeof index.stream.batch, 'function', 'valid function');
    t.equal(typeof index.stream.split, 'function', 'valid function');
    t.end();
  });
  test('streams polyline', function(t) {
    t.equal(typeof index.stream.polyline, 'object', 'valid object');
    t.equal(typeof index.stream.polyline.augment, 'function', 'valid function');
    t.equal(typeof index.stream.polyline.autoincrement, 'function', 'valid function');
    t.equal(typeof index.stream.polyline.import, 'function', 'valid function');
    t.equal(typeof index.stream.polyline.parse, 'function', 'valid function');
    t.end();
  });
  test('streams oa', function(t) {
    t.equal(typeof index.stream.oa, 'object', 'valid object');
    t.equal(typeof index.stream.oa.augment, 'function', 'valid function');
    t.equal(typeof index.stream.oa.batch, 'function', 'valid function');
    t.equal(typeof index.stream.oa.import, 'function', 'valid function');
    t.equal(typeof index.stream.oa.lookup, 'function', 'valid function');
    t.equal(typeof index.stream.oa.parse, 'function', 'valid function');
    t.end();
  });
};

module.exports.interface.query = function(test) {
  test('queries', function(t) {
    t.equal(typeof index.query.address, 'function', 'valid function');
    t.equal(typeof index.query.attach, 'function', 'valid function');
    t.equal(typeof index.query.configure, 'function', 'valid function');
    t.equal(typeof index.query.indexes, 'object', 'valid function');
    t.equal(typeof index.query.indexes.street, 'function', 'valid function');
    t.equal(typeof index.query.indexes.address, 'function', 'valid function');
    t.equal(typeof index.query.lookup, 'function', 'valid function');
    t.equal(typeof index.query.tables, 'object', 'valid function');
    t.equal(typeof index.query.tables.street, 'function', 'valid function');
    t.equal(typeof index.query.tables.address, 'function', 'valid function');
    t.end();
  });
};

module.exports.interface.lib = function(test) {
  test('libs', function(t) {
    t.equal(typeof index.lib.analyze, 'object', 'valid function');
    t.equal(typeof index.lib.analyze.street, 'function', 'valid function');
    t.equal(typeof index.lib.analyze.housenumber, 'function', 'valid function');
    t.equal(typeof index.lib.assert, 'object', 'valid function');
    t.equal(typeof index.lib.assert.log, 'function', 'valid function');
    t.equal(typeof index.lib.pretty, 'object', 'valid function');
    t.equal(typeof index.lib.pretty.table, 'function', 'valid function');
    t.equal(typeof index.lib.pretty.geojson, 'function', 'valid function');
    t.equal(typeof index.lib.project, 'object', 'valid function');
    t.equal(typeof index.lib.project.pointOnEdge, 'function', 'valid function');
    t.equal(typeof index.lib.project.pointOnLine, 'function', 'valid function');
    t.equal(typeof index.lib.project.distance, 'function', 'valid function');
    t.equal(typeof index.lib.project.lineDistance, 'function', 'valid function');
    t.equal(typeof index.lib.project.sliceLineAtProjection, 'function', 'valid function');
    t.equal(typeof index.lib.statistics, 'function', 'valid function');
    t.end();
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('external interface: ' + name, testFunction);
  }

  for( var testCase in module.exports.interface ){
    module.exports.interface[testCase](test);
  }
};
