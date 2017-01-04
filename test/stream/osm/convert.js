
var through = require('through2'),
    Address = require('../../../lib/Address'),
    convert = require('../../../stream/osm/convert');

module.exports.street = {};

module.exports.street.node = function(test) {
  test('simple', function(t) {

    var json = {
      id: 1231231,
      type: 'node',
      tags: {
        'addr:housenumber':'9',
        'addr:street':'Nevern Road'
      },
      lat: 51.492758,
      lon: -0.198273
    };

    stream( json, function( records ){

      t.equal( records.length, 1 );
      t.true( records[0] instanceof Address );

      var address = records[0];
      t.equal( address.getId(), 'node:1231231' );
      t.equal( address.getStreet(), 'Nevern Road' );
      t.equal( address.getNumber(), '9' );
      t.deepEqual( address.getCoord(), { lat: 51.492758, lon: -0.198273 } );

      t.end();
    });
  });
  test('advanced', function(t) {

    var json = {
      id: 1231231,
      type: 'node',
      tags: {
        'addr:housenumber':'9',
        'addr:street':'Nevern Road',
        'addr:unit':'1a',
        'addr:city':'Foo City',
        'addr:district':'Foo District',
        'addr:province':'Foo Province',
        'addr:postcode':'F00F00'
      },
      centroid: {
        lat: 51.492758,
        lon: -0.198273
      }
    };

    stream( json, function( records ){

      t.equal( records.length, 1 );
      t.true( records[0] instanceof Address );

      var address = records[0];
      t.equal( address.getId(), 'node:1231231' );
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
};

module.exports.street.way = function(test) {
  test('simple', function(t) {

    var json = {
      id: 30658143,
      type: 'way',
      tags: {
        'addr:housenumber':'9',
        'addr:street':'Nevern Road'
      },
      centroid: {
        lat: 51.492758,
        lon: -0.198273
      }
    };

    stream( json, function( records ){

      t.equal( records.length, 1 );
      t.true( records[0] instanceof Address );

      var address = records[0];
      t.equal( address.getId(), 'way:30658143' );
      t.equal( address.getStreet(), 'Nevern Road' );
      t.equal( address.getNumber(), '9' );
      t.deepEqual( address.getCoord(), { lat: 51.492758, lon: -0.198273 } );

      t.end();
    });
  });
  test('advanced', function(t) {

    var json = {
      id: 30658143,
      type: 'way',
      tags: {
        'addr:housenumber':'9',
        'addr:street':'Nevern Road',
        'addr:unit':'1a',
        'addr:city':'Foo City',
        'addr:district':'Foo District',
        'addr:province':'Foo Province',
        'addr:postcode':'F00F00'
      },
      centroid: {
        lat: 51.492758,
        lon: -0.198273
      }
    };

    stream( json, function( records ){

      t.equal( records.length, 1 );
      t.true( records[0] instanceof Address );

      var address = records[0];
      t.equal( address.getId(), 'way:30658143' );
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
function stream( json, cb ){

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
  xform.write( json );
  xform.end();
}
