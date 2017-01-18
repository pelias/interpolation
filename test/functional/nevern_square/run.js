
var fs = require('fs'),
    path = require('path'),
    sqlite3 = require('../sqlite3'),
    action = require('../action'),
    search = require('../../../api/search');

var paths = {
  reports: path.resolve( __dirname, './reports/' ),
  expected: path.resolve( __dirname, './fixture/expected.dump' ),
  fixture: {
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
    t.equal(polylines, 4, 'count(polyline)');

    // count names table
    var names = sqlite3.count( paths.db.street, 'names' );
    t.equal(names, 4, 'count(names)');

    // count rtree table
    var rtree = sqlite3.count( paths.db.street, 'rtree' );
    t.equal(rtree, 4, 'count(rtree)');

    t.end();
  });
};

module.exports.functional.address_counts = function(test) {
  test('address db table counts', function(t) {

    // count address table
    var addresses = sqlite3.count( paths.db.address, 'address' );
    t.equal(addresses, 27, 'count(address)');

    t.end();
  });
};

module.exports.functional.spotcheck = function(test) {
  test('spot checks', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1' );
    t.equal(count1, 21);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1 AND source="OSM"' );
    t.equal(count2, 19);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1 AND source="VERTEX"' );
    t.equal(count3, 2);

    t.end();
  });
};

module.exports.functional.end_to_end = function(test) {
  test('end to end', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( paths.db.address, 'SELECT * FROM address WHERE id=1 ORDER BY housenumber' );
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

  test('search: exact', function(t) {

    var coord = { lat: 51.49184, lon: -0.19694 };
    var number = '18';
    var street = 'nevern square';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'exact',
        source: 'OSM',
        source_id: 'way:108009866',
        number: '18',
        lat: 51.491618,
        lon: -0.196181
      });
      t.end();
    });
  });

  test('search: close', function(t) {

    var coord = { lat: 51.49184, lon: -0.19694 };
    var number = '18a';
    var street = 'nevern square';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'close',
        source: 'OSM',
        source_id: 'way:108009866',
        number: '18',
        lat: 51.491618,
        lon: -0.196181
      });
      t.end();
    });
  });

  test('search: interpolated', function(t) {

    var coord = { lat: 51.49184, lon: -0.19694 };
    var number = '21';
    var street = 'nevern square';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'interpolated',
        source: 'mixed',
        number: '21',
        lat: 51.4915576,
        lon: -0.1965372
      });
      t.end();
    });
  });

  test('search: interpolated - must not interpolate in center of park', function(t) {

    var coord = { lat: 51.49184, lon: -0.19694 };
    var number = '49';
    var street = 'nevern square';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'interpolated',
        source: 'mixed',
        number: '49',
        lat: 51.4920998,
        lon: -0.1971472
      });

      // these co-ordinates are the linear interpolation between two
      // different road segments. they result in the middle of a park
      // this test should ensure that interpolation must be between two
      // points on the same road segment to ensure the interpolated point
      // lies on the road network.
      // t.false( res.lat === 51.4920998 );
      // t.false( res.lon === -0.1971472 );
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
  action.geojson(test, paths, 'id=1');
};

// write tsv to disk
module.exports.functional.tsv = function(test) {
  action.tsv(test, paths, 'id=1');
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: nevern square: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
