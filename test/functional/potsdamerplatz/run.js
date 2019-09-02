
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
    t.equal(polylines, 303, 'count(polyline)');

    // count names table
    var names = sqlite3.count( paths.db.street, 'names' );
    t.equal(names, 487, 'count(names)');

    // count rtree table
    var rtree = sqlite3.count( paths.db.street, 'rtree' );
    t.equal(rtree, 303, 'count(rtree)');

    t.end();
  });
};

module.exports.functional.address_counts = function(test) {
  test('address db table counts', function(t) {

    // count address table
    var addresses = sqlite3.count( paths.db.address, 'address' );
    t.equal(addresses, 505, 'count(address)');

    t.end();
  });
};

// the segment of the road with the bahnhof on it has few valid addresses (numbers 8 & 9)
module.exports.functional.spotcheck_bahnhof_segment = function(test) {
  test('spot checks - bahnhof (train station) segment', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=40' );
    t.equal(count1, 2);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=40 AND source="OA"' );
    t.equal(count2, 2);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=40 AND source="VERTEX"' );
    t.equal(count3, 0);

    t.end();
  });
};

// the north segment has low house numbers on it (numbers 3, 4 & 5)
module.exports.functional.spotcheck_north_segment = function(test) {
  test('spot checks - north segment', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=45' );
    t.equal(count1, 3);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=45 AND source="OA"' );
    t.equal(count2, 3);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=45 AND source="VERTEX"' );
    t.equal(count3, 0);

    t.end();
  });
};

// the south segment has few house numbers on it (only number 10?)
module.exports.functional.spotcheck_south_segment = function(test) {
  test('spot checks - south segment', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=41' );
    t.equal(count1, 1);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=41 AND source="OA"' );
    t.equal(count2, 1);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=41 AND source="VERTEX"' );
    t.equal(count3, 0);

    t.end();
  });
};

// there are two odd segments which should really be potsdamer strasse but appear to be named
// potsdamer platz for some weird/ historical reason. it's a prestiguous address; hence people want it.
// (has number 2 on it)
module.exports.functional.spotcheck_weird_north_segment = function(test) {
  test('spot checks - weird north segment', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=39' );
    t.equal(count1, 1);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=39 AND source="OA"' );
    t.equal(count2, 1);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=39 AND source="VERTEX"' );
    t.equal(count3, 0);

    t.end();
  });
};

// there are two odd segments which should really be potsdamer strasse but appear to be named
// potsdamer platz for some weird/ historical reason. it's a prestiguous address; hence people want it.
// (has numbers 1 & 11 on it, well kind of, this looks technically correct)
module.exports.functional.spotcheck_weird_south_segment = function(test) {
  test('spot checks - weird south segment', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=46' );
    t.equal(count1, 2);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=46 AND source="OA"' );
    t.equal(count2, 2);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=46 AND source="VERTEX"' );
    t.equal(count3, 0);

    t.end();
  });
};

module.exports.functional.end_to_end = function(test) {
  test('end to end', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( paths.db.address, 'SELECT * FROM address WHERE id=40 ORDER BY housenumber' );
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

    var coord = { lat: 52.509, lon: 13.376 };
    var number = '4';
    var street = 'potsdamer platz';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'exact',
        source: 'OA',
        source_id: 'bea1557e7fd88d96',
        number: '4',
        lat: 52.510195,
        lon: 	13.3756481
      });
      t.end();
    });
  });

  test('search: close', function(t) {

    var coord = { lat: 52.509, lon: 13.376 };
    var number = '8b';
    var street = 'potsdamer platz';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'close',
        source: 'OA',
        source_id: '5376552947c34f14',
        number: '8',
        lat: 52.5089803,
        lon: 	13.3771165
      });
      t.end();
    });
  });

  test('search: interpolated', function(t) {

    var coord = { lat: 52.509, lon: 13.376 };
    var number = '6';
    var street = 'potsdamer platz';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'interpolated',
        source: 'mixed',
        number: '6',
        lat: 52.509349,
        lon: 13.375818
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
  action.geojson(test, paths, 'id=40', 'bahnhof');
  action.geojson(test, paths, 'id=45', 'north');
  action.geojson(test, paths, 'id=41', 'south');
  action.geojson(test, paths, 'id=39', 'weird.north');
  action.geojson(test, paths, 'id=46', 'weird.south');
};

// write tsv to disk
module.exports.functional.tsv = function(test) {
  action.tsv(test, paths, 'id=40', 'bahnhof');
  action.tsv(test, paths, 'id=45', 'north');
  action.tsv(test, paths, 'id=41', 'south');
  action.tsv(test, paths, 'id=39', 'weird.north');
  action.tsv(test, paths, 'id=46', 'weird.south');
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: potsdamerplatz: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
