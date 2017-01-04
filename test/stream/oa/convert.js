
var through = require('through2'),
    Address = require('../../../lib/Address'),
    convert = require('../../../stream/oa/convert');

module.exports.street = {};

module.exports.street.node = function(test) {
  test('simple', function(t) {

    var csv = {
      HASH: '786378467238',
      STREET: 'Nevern Road',
      NUMBER: '9',
      LAT: 51.492758,
      LON: -0.198273
    };

    stream( csv, function( records ){

      t.equal( records.length, 1 );
      t.true( records[0] instanceof Address );

      var address = records[0];
      t.equal( address.getId(), '786378467238' );
      t.equal( address.getStreet(), 'Nevern Road' );
      t.equal( address.getNumber(), '9' );
      t.deepEqual( address.getCoord(), { lat: 51.492758, lon: -0.198273 } );

      t.end();
    });
  });
  test('advanced', function(t) {

    var csv = {
      HASH: '786378467238',
      STREET: 'Nevern Road',
      NUMBER: '9',
      LAT: 51.492758,
      LON: -0.198273,
      UNIT: '1a',
      CITY: 'Foo City',
      DISTRICT: 'Foo District',
      REGION: 'Foo Province',
      POSTCODE: 'F00F00'
    };

    stream( csv, function( records ){

      t.equal( records.length, 1 );
      t.true( records[0] instanceof Address );

      var address = records[0];
      t.equal( address.getId(), '786378467238' );
      t.equal( address.getStreet(), 'Nevern Road' );
      t.equal( address.getNumber(), '9' );
      t.deepEqual( address.getCoord(), { lat: 51.492758, lon: -0.198273 } );
      t.equal( address.getUnit(), '1a' );
      t.equal( address.getCity(), 'Foo City' );
      t.equal( address.getDistrict(), 'Foo District' );
      t.equal( address.getRegion(), 'Foo Province' );
      t.equal( address.getPostcode(), 'F00F00' );

      t.end();
    });
  });
  test('no hash', function(t) {

    var csv = {
      STREET: 'Nevern Road',
      NUMBER: '9',
      LAT: 51.492758,
      LON: -0.198273
    };

    stream( csv, function( records ){

      t.equal( records.length, 1 );
      t.true( records[0] instanceof Address );

      var address = records[0];
      t.equal( address.getId(), '1' );
      t.equal( address.getStreet(), 'Nevern Road' );
      t.equal( address.getNumber(), '9' );
      t.deepEqual( address.getCoord(), { lat: 51.492758, lon: -0.198273 } );

      t.end();
    });
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('convert: ' + name, testFunction);
  }

  for( var testCase in module.exports.street ){
    module.exports.street[testCase](test);
  }
};

// generic stream test runner
function stream( csv, cb ){

  var xform = convert();
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
  xform.write( csv );
  xform.end();
}
