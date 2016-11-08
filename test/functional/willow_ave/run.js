
var fs = require('fs'),
    path = require('path'),
    sqlite3 = require('../sqlite3'),
    action = require('../action'),
    search = require('../../../api/search');

/**
  issue: https://github.com/pelias/interpolation/issues/13
**/

var paths = {
  reports: path.resolve( __dirname, './reports/' ),
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
    t.equal(polylines, 46, 'count(polyline)');

    // count names table
    var names = sqlite3.count( paths.db.street, 'names' );
    t.equal(names, 50, 'count(names)');

    // count rtree table
    var rtree = sqlite3.count( paths.db.street, 'rtree' );
    t.equal(rtree, 46, 'count(rtree)');

    t.end();
  });
};

module.exports.functional.address_counts = function(test) {
  test('address db table counts', function(t) {

    // count address table
    var addresses = sqlite3.count( paths.db.address, 'address' );
    t.equal(addresses, 1517, 'count(address)');

    t.end();
  });
};

module.exports.functional.spotcheck = function(test) {
  test('spot checks', function(t) {

    // counts for a house number
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE source="OA" AND housenumber="1004.0"' );
    t.equal(count1, 1); // there are 4 houses with the number 1004 in the source data
    // note: this is actually an error in the data, see: https://github.com/pelias/interpolation/issues/13#issuecomment-255785452

    // ensure housenumber:560 lies on the correct street
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id="8" AND housenumber="560.0"' );
    t.equal(count2, 1);

    // ensure housenumber:95 lies on the correct street
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id="11" AND housenumber="95.0"' );
    t.equal(count3, 1);

    // ensure housenumber:2 lies on the correct street
    var count4 = sqlite3.count( paths.db.address, 'address', 'WHERE id="1" AND housenumber="2"' );
    t.equal(count4, 1);

    // ensure housenumber:260 lies on the correct street
    var count5 = sqlite3.count( paths.db.address, 'address', 'WHERE id="32" AND housenumber="260"' );
    t.equal(count5, 1);

    t.end();
  });
};

// write geojson to disk
module.exports.functional.geojson = function(test) {
  action.geojson(test, paths, 'id=11');
};

// write tsv to disk
module.exports.functional.tsv = function(test) {
  action.tsv(test, paths, 'id=11');
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: willow_ave: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
