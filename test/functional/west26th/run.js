
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
    polyline: path.resolve( __dirname, './osm.polylines' )
  },
  db: {
    address: path.resolve( __dirname, './address.db' ),
    street: path.resolve( __dirname, './street.db' )
  }
};

module.exports.functional = {};

// import data
module.exports.functional.import = function(test) {
  action.import(test, paths);
};

// perform conflation
module.exports.functional.conflate = function(test) {
  action.conflate(test, paths);
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
    t.equal(addresses, 188, 'count(address)');

    t.end();
  });
};

module.exports.functional.spotcheck = function(test) {
  test('spot checks', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=85' );
    t.equal(count1, 188);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=85 AND source="OA"' );
    t.equal(count2, 106);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=85 AND source="VERTEX"' );
    t.equal(count3, 82);

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

  test('search: exact', function(t) {

    var coord = { lat: 40.749, lon: -74 };
    var number = '537';
    var street = 'west 26th street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'exact',
        source: 'OA',
        number: '537',
        lat: 40.7504506,
        lon: -74.0045915
      });
      t.end();
    });
  });

  test('search: close', function(t) {

    var coord = { lat: 40.749, lon: -74 };
    var number = '537f';
    var street = 'west 26th street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'close',
        source: 'OA',
        number: '537',
        lat: 40.7504506,
        lon: -74.0045915
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
        lat: 40.7495759,
        lon: -74.0027489
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
