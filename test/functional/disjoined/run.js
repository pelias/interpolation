
var fs = require('fs'),
    path = require('path'),
    sqlite3 = require('../sqlite3'),
    action = require('../action'),
    search = require('../../../api/search');

var paths = {
  reports: path.resolve( __dirname, './reports/' ),
  expected1: path.resolve( __dirname, './fixture/expected.north.dump' ),
  expected2: path.resolve( __dirname, './fixture/expected.south.dump' ),
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
    t.equal(names, 8, 'count(names)');

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
    t.equal(addresses, 41, 'count(address)');

    t.end();
  });
};

module.exports.functional.spotcheck_north = function(test) {
  test('spot check: north side', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1' );
    t.equal(count1, 22);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1 AND source="OA"' );
    t.equal(count2, 22);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1 AND source="VERTEX"' );
    t.equal(count3, 0);

    t.end();
  });
};

module.exports.functional.end_to_end_north = function(test) {
  test('end to end: north side', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( paths.db.address, 'SELECT * FROM address WHERE id=1 ORDER BY housenumber' );
    t.deepEqual(rows, fs.readFileSync( paths.expected1 ).toString('utf8').trim().split('\n') );

    t.end();
  });
};

// note: no interpolation available as street has 100% coverage already
module.exports.functional.search_north = function(test) {

  // database connection
  var conn;

  // connect to databases
  test('open connection', function(t) {
    conn = search( paths.db.address, paths.db.street );
    t.pass();
    t.end();
  });

  test('search: north: exact', function(t) {

    var coord = { lat: 52.507, lon: 13.32 };
    var number = '21';
    var street = 'grolmanstrasse';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'exact',
        source: 'OA',
        source_id: '055e663b094ec129',
        number: '21',
        lat: 52.5071733,
        lon: 13.3210882
      });
      t.end();
    });
  });

  test('search: north: close', function(t) {

    var coord = { lat: 52.507, lon: 13.32 };
    var number = '21d';
    var street = 'grolmanstrasse';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'close',
        source: 'OA',
        source_id: '055e663b094ec129',
        number: '21',
        lat: 52.5071733,
        lon: 13.3210882
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

module.exports.functional.spotcheck_south = function(test) {
  test('spot check: south side', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=2' );
    t.equal(count1, 19);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=2 AND source="OA"' );
    t.equal(count2, 19);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=2 AND source="VERTEX"' );
    t.equal(count3, 0);

    t.end();
  });
};

module.exports.functional.end_to_end_south = function(test) {
  test('end to end: south side', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( paths.db.address, 'SELECT * FROM address WHERE id=2 ORDER BY housenumber' );
    t.deepEqual(rows, fs.readFileSync( paths.expected2 ).toString('utf8').trim().split('\n') );

    t.end();
  });
};

// note: no interpolation available as street has 100% coverage already
module.exports.functional.search_south = function(test) {

  // database connection
  var conn;

  // connect to databases
  test('open connection', function(t) {
    conn = search( paths.db.address, paths.db.street );
    t.pass();
    t.end();
  });

  test('search: south: exact', function(t) {

    var coord = { lat: 52.503, lon: 13.324 };
    var number = '43';
    var street = 'grolmanstrasse';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'exact',
        source: 'OA',
        source_id: '52701100dae38faf',
        number: '43',
        lat: 52.5042048,
        lon: 13.324045
      });
      t.end();
    });
  });

  test('search: south: close', function(t) {

    var coord = { lat: 52.503, lon: 13.324 };
    var number = '43d';
    var street = 'grolmanstrasse';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'close',
        source: 'OA',
        source_id: '52701100dae38faf',
        number: '43',
        lat: 52.5042048,
        lon: 13.324045
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
  action.geojson(test, paths, '(id=1 OR id=2)');
};

// write tsv to disk
module.exports.functional.tsv = function(test) {
  action.tsv(test, paths, '(id=1 OR id=2)');
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: disjoined: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
