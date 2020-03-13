
var fs = require('fs'),
    path = require('path'),
    sqlite3 = require('../sqlite3'),
    action = require('../action'),
    search = require('../../../api/search');

var paths = {
  reports: path.resolve( __dirname, './reports/' ),
  expected: path.resolve( __dirname, './fixture/expected.dump' ),
  fixture: {
    oa: path.resolve( __dirname, './oa.csv' ),
    osm: path.resolve( __dirname, './osm.addresses.json' ),
    polyline: path.resolve( __dirname, './osm.polylines' )
  },
  db: {
    address: path.resolve( __dirname, './address.db' ),
    street: path.resolve( __dirname, './street.db' )
  }
};

module.exports.functional = {};

// clean working directory
module.exports.functional.clean = function(test) {
  action.clean(test, paths);
};

// import data
module.exports.functional.import = function(test) {
  action.import(test, paths);
};

// perform oa conflation
module.exports.functional.oa = function(test) {
  action.oa(test, paths);
};

// perform osm conflation
module.exports.functional.osm = function(test) {
  action.osm(test, paths);
};

// perform vertex interpolation
module.exports.functional.vertices = function(test) {
  action.vertices(test, paths);
};

// check table schemas
module.exports.functional.schema = function(test) {
  action.check.schema(test, paths);
};

// check table indexes
module.exports.functional.indexes = function(test) {
  action.check.indexes(test, paths);
};

module.exports.functional.street_counts = function(test) {
  test('street db table counts', function(t) {

    // count polyline table
    var polylines = sqlite3.count( paths.db.street, 'polyline' );
    t.equal(polylines, 100, 'count(polyline)');

    // count names table
    var names = sqlite3.count( paths.db.street, 'names' );
    t.equal(names, 106, 'count(names)');

    // count rtree table
    var rtree = sqlite3.count( paths.db.street, 'rtree' );
    t.equal(rtree, 100, 'count(rtree)');

    t.end();
  });
};

module.exports.functional.address_counts = function(test) {
  test('address db table counts', function(t) {

    // count address table
    var addresses = sqlite3.count( paths.db.address, 'address' );
    t.equal(addresses, 128, 'count(address)');

    t.end();
  });
};

module.exports.functional.spotcheck = function(test) {
  test('spot checks', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=85' );
    t.equal(count1, 128);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=85 AND source="OA"' );
    t.equal(count2, 106);

    // counts for a specific street (openstreetmap)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=85 AND source="OSM"' );
    t.equal(count3, 7);

    // counts for a specific street (vertexes)
    var count4 = sqlite3.count( paths.db.address, 'address', 'WHERE id=85 AND source="VERTEX"' );
    t.equal(count4, 15);

    t.end();
  });
};

module.exports.functional.end_to_end = function(test) {
  test('end to end', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( paths.db.address, 'SELECT * FROM address WHERE id=85 ORDER BY housenumber' );
    t.deepEqual(rows, fs.readFileSync( paths.expected ).toString('utf8').trim().split('\n') );

    t.end();
  });
};

module.exports.functional.search = function(test) {

  // database connection
  var conn;

  // connect to databases
  test('open connection', function(t) {
    conn = search( paths.db.address, paths.db.street );
    t.pass();
    t.end();
  });

  test('search: exact (OA)', function(t) {

    var coord = { lat: 40.749, lon: -74 };
    var number = '537';
    var street = 'west 26th street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'exact',
        source: 'OA',
        source_id: '000005',
        number: '537',
        lat: 40.7504506,
        lon: -74.0045915
      });
      t.end();
    });
  });

  test('search: exact (OSM)', function(t) {

    var coord = { lat: 40.749, lon: -74 };
    var number = '36';
    var street = 'west 26th street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'exact',
        source: 'OSM',
        source_id: 'node:2621559132',
        number: '36',
        lat: 40.7443525,
        lon: -73.9906047
      });
      t.end();
    });
  });

  test('search: close (OA)', function(t) {

    var coord = { lat: 40.749, lon: -74 };
    var number = '537f';
    var street = 'west 26th street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'close',
        source: 'OA',
        source_id: '000005',
        number: '537',
        lat: 40.7504506,
        lon: -74.0045915
      });
      t.end();
    });
  });

  test('search: close (OSM)', function(t) {

    var coord = { lat: 40.749, lon: -74 };
    var number = '352f';
    var street = 'west 26th street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'close',
        source: 'OSM',
        source_id: 'node:2703201644',
        number: '352',
        lat: 40.7480383,
        lon: -73.9996074
      });
      t.end();
    });
  });

  test('search: interpolated', function(t) {

    var coord = { lat: 40.749, lon: -74 };
    var number = '475';
    var street = 'west 26th street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'interpolated',
        source: 'mixed',
        number: '475',
        lat: 40.749529,
        lon: -74.0026372
      });
      t.end();
    });
  });

  test('search: interpolated (between two different datasets)', function(t) {

    var coord = { lat: 40.749, lon: -74 };
    var number = '257';
    var street = 'west 26th street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'interpolated',
        source: 'mixed',
        number: '257',
        lat: 40.7470427,
        lon: -73.996716
      });
      t.end();
    });
  });

  test('close connection', function(t) {
    conn.close();
    t.pass();
    t.end();
  });
};

// write geojson to disk
module.exports.functional.geojson = function(test) {
  action.geojson(test, paths, 'id=85');
};

// write tsv to disk
module.exports.functional.tsv = function(test) {
  action.tsv(test, paths, 'id=85');
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: west26th: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
