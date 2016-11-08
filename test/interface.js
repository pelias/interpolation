
var index = require('../index');

module.exports.interface = {};

module.exports.interface.exports = function(test) {
  test('exports', function(t) {
    t.equal(typeof index, 'object', 'valid object');
    t.equal(typeof index.api, 'object', 'valid object');
    t.equal(typeof index.lib, 'object', 'valid object');
    t.equal(typeof index.query, 'object', 'valid object');
    t.equal(typeof index.stream, 'object', 'valid object');
    t.end();
  });
};

module.exports.interface.stream = function(test) {
  test('streams general', function(t) {
    t.equal(typeof index.stream.batch, 'function', 'valid function');
    t.equal(typeof index.stream.each, 'function', 'valid function');
    t.equal(typeof index.stream.split, 'function', 'valid function');
    t.end();
  });
  test('streams street', function(t) {
    t.equal(typeof index.stream.street.augment, 'function', 'valid function');
    t.equal(typeof index.stream.street.import, 'function', 'valid function');
    t.end();
  });
  test('streams address', function(t) {
    t.equal(typeof index.stream.address.augment, 'function', 'valid function');
    t.equal(typeof index.stream.address.batch, 'function', 'valid function');
    t.equal(typeof index.stream.address.import, 'function', 'valid function');
    t.equal(typeof index.stream.address.lookup, 'function', 'valid function');
    t.end();
  });
  test('streams polyline', function(t) {
    t.equal(typeof index.stream.polyline.autoincrement, 'function', 'valid function');
    t.equal(typeof index.stream.polyline.parse, 'function', 'valid function');
    t.end();
  });
  test('streams oa', function(t) {
    t.equal(typeof index.stream.oa.convert, 'function', 'valid function');
    t.equal(typeof index.stream.oa.parse, 'function', 'valid function');
    t.end();
  });
  test('streams osm', function(t) {
    t.equal(typeof index.stream.osm.convert, 'function', 'valid function');
    t.equal(typeof index.stream.osm.parse, 'function', 'valid function');
    t.end();
  });
};

module.exports.interface.query = function(test) {
  test('queries', function(t) {
    t.equal(typeof index.query.extract, 'function', 'valid function');
    t.equal(typeof index.query.search, 'function', 'valid function');
    t.equal(typeof index.query.attach, 'function', 'valid function');
    t.equal(typeof index.query.configure, 'function', 'valid function');
    t.equal(typeof index.query.indexes, 'object', 'valid object');
    t.equal(typeof index.query.indexes.street, 'function', 'valid function');
    t.equal(typeof index.query.indexes.address, 'function', 'valid function');
    t.equal(typeof index.query.lookup, 'function', 'valid function');
    t.equal(typeof index.query.tables, 'object', 'valid object');
    t.equal(typeof index.query.tables.street, 'function', 'valid function');
    t.equal(typeof index.query.tables.address, 'function', 'valid function');
    t.end();
  });
};

module.exports.interface.lib = function(test) {
  test('libs', function(t) {
    t.equal(typeof index.lib.analyze, 'object', 'valid object');
    t.equal(typeof index.lib.analyze.street, 'function', 'valid function');
    t.equal(typeof index.lib.analyze.housenumber, 'function', 'valid function');
    t.equal(typeof index.lib.assert, 'object', 'valid object');
    t.equal(typeof index.lib.assert.log, 'function', 'valid function');
    t.equal(typeof index.lib.proximity, 'object', 'valid object');
    t.equal(typeof index.lib.proximity.nearest.street, 'function', 'valid function');
    t.equal(typeof index.lib.pretty, 'object', 'valid object');
    t.equal(typeof index.lib.pretty.table, 'function', 'valid function');
    t.equal(typeof index.lib.pretty.geojson, 'function', 'valid function');
    t.equal(typeof index.lib.project, 'object', 'valid object');
    t.equal(typeof index.lib.project.pointOnEdge, 'function', 'valid function');
    t.equal(typeof index.lib.project.pointOnLine, 'function', 'valid function');
    t.equal(typeof index.lib.project.distance, 'function', 'valid function');
    t.equal(typeof index.lib.project.lineDistance, 'function', 'valid function');
    t.equal(typeof index.lib.project.sliceLineAtProjection, 'function', 'valid function');
    t.equal(typeof index.lib.project.parity, 'function', 'valid function');
    t.equal(typeof index.lib.project.bearing, 'function', 'valid function');
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
