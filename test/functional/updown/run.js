
const fs = require('fs');
const path = require('path');
const sqlite3 = require('../sqlite3');
const action = require('../action');
const search = require('../../../api/search').setup;

const paths = {
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
    const polylines = sqlite3.count( paths.db.street, 'polyline' );
    t.equal(polylines, 44, 'count(polyline)');

    // count names table
    const names = sqlite3.count( paths.db.street, 'names' );
    t.equal(names, 44, 'count(names)');

    // count rtree table
    const rtree = sqlite3.count( paths.db.street, 'rtree' );
    t.equal(rtree, 44, 'count(rtree)');

    t.end();
  });
};

module.exports.functional.address_counts = function(test) {
  test('address db table counts', function(t) {

    // count address table
    const addresses = sqlite3.count( paths.db.address, 'address' );
    t.equal(addresses, 146, 'count(address)');

    t.end();
  });
};

module.exports.functional.spotcheck = function(test) {
  test('spot checks - main street segment', function(t) {

    // counts for a specific street
    const count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=17' );
    t.equal(count1, 133);

    // counts for a specific street (open addresses)
    const count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=17 AND source="OA"' );
    t.equal(count2, 128);

    // counts for a specific street (vertexes)
    const count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=17 AND source="VERTEX"' );
    t.equal(count3, 5);

    t.end();
  });

  test('spot checks - small side street segment', function(t) {

    // counts for a specific street
    const count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=18' );
    t.equal(count1, 4);

    // counts for a specific street (open addresses)
    const count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=18 AND source="OA"' );
    t.equal(count2, 4);

    // counts for a specific street (vertexes)
    const count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=18 AND source="VERTEX"' );
    t.equal(count3, 0);

    // check a specific address exists on a small off-street
    const count4 = sqlite3.count( paths.db.address, 'address', 'WHERE id=18 AND source="OA" AND housenumber="47.03"' );
    t.equal(count4, 1);

    // check a specific address exists on a small off-street
    const count5 = sqlite3.count( paths.db.address, 'address', 'WHERE id=18 AND source="OA" AND housenumber="47.06"' );
    t.equal(count5, 1);

    t.end();
  });
};

module.exports.functional.end_to_end = function(test) {
  test('end to end', function(t) {

    // full interpolation for a single street
    const rows = sqlite3.exec( paths.db.address, 'SELECT * FROM address WHERE id IN (17,18) ORDER BY housenumber' );
    t.deepEqual(rows, fs.readFileSync( paths.expected ).toString('utf8').trim().split('\n') );

    t.end();
  });
};

module.exports.functional.search = function(test) {

  // database connection
  let conn;

  // connect to databases
  test('open connection', function(t) {
    conn = search( paths.db.address, paths.db.street );
    t.pass();
    t.end();
  });

  test('search: exact', function(t) {

    const coord = { lat: 52.517, lon: 13.458 };
    const number = '18d';
    const street = 'rigaer strasse';

    const res = conn.query( coord, number, street );
    t.deepEqual( res, {
      type: 'exact',
      source: 'OA',
      source_id: '6285536db072454c',
      number: '18d',
      lat: 52.5168882,
      lon: 13.4585878
    });
    t.end();
  });

  test('search: close', function(t) {

    const coord = { lat: 52.517, lon: 13.458 };
    const number = '16c';
    const street = 'rigaer strasse';

    const res = conn.query( coord, number, street );
    t.deepEqual( res, {
      type: 'close',
      source: 'OA',
      source_id: '12f79e80dfcec775',
      number: '16a',
      lat: 52.5167765,
      lon: 13.4575346
    });
    t.end();
  });

  test('search: interpolated', function(t) {

    const coord = { lat: 52.517, lon: 13.458 };
    const number = '11';
    const street = 'rigaer strasse';

    const res = conn.query( coord, number, street );
    t.deepEqual( res, {
      type: 'interpolated',
      source: 'mixed',
      number: '11',
      lat: 52.5178399,
      lon: 13.4568939
    });
    t.end();
  });

  test('close connection', function(t) {
    conn.close();
    t.pass();
    t.end();
  });
};

// write geojson to disk
module.exports.functional.geojson = function(test) {
  action.geojson(test, paths, 'id=17', 'preview.main');
  action.geojson(test, paths, 'id=18', 'preview.side');
};

// write tsv to disk
module.exports.functional.tsv = function(test) {
  action.tsv(test, paths, 'id=17', 'preview.main');
  action.tsv(test, paths, 'id=16', 'preview.side');
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: updown: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
