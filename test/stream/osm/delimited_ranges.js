
var through = require('through2'),
    delimited_ranges = require('../../../stream/osm/delimited_ranges');

module.exports.street = {};

module.exports.street.noop = function(test) {
  test('missing housenumber', function(t) {
    var json = { no: 'housenumber' };
    var records = stream( json, function( records ){
      t.equal( records.length, 1 );
      t.deepEqual( records[0], json );
      t.end();
    });
  });
  test('housenumber does not contain delimiter', function(t) {
    var json = { tags: { 'addr:housenumber': '1A' } };
    var records = stream( json, function( records ){
      t.equal( records.length, 1 );
      t.deepEqual( records[0], json );
      t.end();
    });
  });
};

module.exports.street.range = function(test) {
  test('split on comma', function(t) {
    var json = { tags: { 'addr:housenumber': '1A,2B' }, misc: 'value' };
    var records = stream( json, function( records ){
      t.equal( records.length, 2 );
      t.equal( records[0].tags['addr:housenumber'], '1A' );
      t.equal( records[0].misc, 'value', 'preserve values' );
      t.equal( records[1].tags['addr:housenumber'], '2B' );
      t.equal( records[1].misc, 'value', 'preserve values' );
      t.end();
    });
  });
  test('split on semi-colon', function(t) {
    var json = { tags: { 'addr:housenumber': '1A;2B' }, misc: 'value' };
    var records = stream( json, function( records ){
      t.equal( records.length, 2 );
      t.equal( records[0].tags['addr:housenumber'], '1A' );
      t.equal( records[0].misc, 'value', 'preserve values' );
      t.equal( records[1].tags['addr:housenumber'], '2B' );
      t.equal( records[1].misc, 'value', 'preserve values' );
      t.end();
    });
  });
};

module.exports.street.range_with_whitespace = function(test) {
  test('superfluous whitespace', function(t) {
    var json = { tags: { 'addr:housenumber': ' 1A, 2B ' }, misc: 'value' };
    var records = stream( json, function( records ){
      t.equal( records.length, 2 );
      t.equal( records[0].tags['addr:housenumber'], '1A' );
      t.equal( records[0].misc, 'value', 'preserve values' );
      t.equal( records[1].tags['addr:housenumber'], '2B' );
      t.equal( records[1].misc, 'value', 'preserve values' );
      t.end();
    });
  });
};

module.exports.street.empty_members = function(test) {
  test('remove empty members', function(t) {
    var json = { tags: { 'addr:housenumber': '1A,,2B;' }, misc: 'value' };
    var records = stream( json, function( records ){
      t.equal( records.length, 2 );
      t.equal( records[0].tags['addr:housenumber'], '1A' );
      t.equal( records[0].misc, 'value', 'preserve values' );
      t.equal( records[1].tags['addr:housenumber'], '2B' );
      t.equal( records[1].misc, 'value', 'preserve values' );
      t.end();
    });
  });
};

module.exports.street.duplicates = function(test) {
  test('remove duplicates', function(t) {
    var json = { tags: { 'addr:housenumber': '1A,1A,2B' }, misc: 'value' };
    var records = stream( json, function( records ){
      t.equal( records.length, 2 );
      t.equal( records[0].tags['addr:housenumber'], '1A' );
      t.equal( records[0].misc, 'value', 'preserve values' );
      t.equal( records[1].tags['addr:housenumber'], '2B' );
      t.equal( records[1].misc, 'value', 'preserve values' );
      t.end();
    });
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('delimited_ranges: ' + name, testFunction);
  }

  for( var testCase in module.exports.street ){
    module.exports.street[testCase](test);
  }
};

// generic stream test runner
function stream( json, cb ){

  var xform = delimited_ranges();
  var records = [];

  var collect = function( chunk, _, next ){
    records.push( chunk );
    next();
  };

  var assert = function( next ){
    cb( records );
    next();
  };

  xform.pipe( through.obj( collect, assert ));
  xform.write( json );
  xform.end();
}
