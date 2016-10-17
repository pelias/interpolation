
var path = require('path'),
    sqlite3 = require('../sqlite3'),
    action = require('../action'),
    search = require('../../../api/search');

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
    t.equal(polylines, 1, 'count(polyline)');

    // count names table
    var names = sqlite3.count( paths.db.street, 'names' );
    t.equal(names, 1, 'count(names)');

    // count rtree table
    var rtree = sqlite3.count( paths.db.street, 'rtree' );
    t.equal(rtree, 1, 'count(rtree)');

    t.end();
  });
};

module.exports.functional.address_counts = function(test) {
  test('address db table counts', function(t) {

    // count address table
    var addresses = sqlite3.count( paths.db.address, 'address' );
    t.equal(addresses, 23, 'count(address)');

    t.end();
  });
};

module.exports.functional.spotcheck = function(test) {
  test('spot checks', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1' );
    t.equal(count1, 23);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1 AND source="OA"' );
    t.equal(count2, 11);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1 AND source="VERTEX"' );
    t.equal(count3, 12);

    t.end();
  });
};

module.exports.functional.end_to_end = function(test) {
  test('end to end', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( paths.db.address, 'SELECT * FROM address WHERE id=1 ORDER BY housenumber' );
    t.deepEqual(rows, [
      '5|1|OA|1.0|-41.2871999|174.766753|R|-41.287285|174.7666662',
      '23|1|VERTEX|2.535||||-41.287388|174.766845',
      '22|1|VERTEX|3.376||||-41.287461|174.766921',
      '21|1|VERTEX|4.154||||-41.287533|174.766983',
      '20|1|VERTEX|4.884||||-41.287606|174.767028',
      '10|1|OA|7.0|-41.2877481|174.7674712|R|-41.2878291|174.7671188',
      '11|1|OA|9.0|-41.2878189|174.7673061|R|-41.2878591|174.767131',
      '19|1|VERTEX|9.878||||-41.287945|174.767166',
      '1|1|OA|10.0|-41.2882585|174.7670996|L|-41.2882734|174.767233',
      '18|1|VERTEX|10.362||||-41.288304|174.767227',
      '2|1|OA|11.0|-41.2880114|174.7674035|R|-41.2880549|174.7672097',
      '3|1|OA|12.0|-41.2884049|174.7670334|L|-41.2884375|174.7671708',
      '17|1|VERTEX|12.946||||-41.288487|174.76715',
      '16|1|VERTEX|14.463||||-41.288567|174.76712',
      '15|1|VERTEX|16.194||||-41.288659|174.767089',
      '14|1|VERTEX|17.161||||-41.288712|174.767089',
      '4|1|OA|18.0|-41.2887878|174.7668435|L|-41.288758|174.767089',
      '6|1|OA|20.0|-41.2888927|174.7667798|L|-41.2888286|174.7671131',
      '7|1|OA|22.0|-41.2889696|174.7667528|L|-41.288849|174.76712',
      '13|1|VERTEX|22.772||||-41.288914|174.767166',
      '8|1|OA|24.0|-41.2890752|174.7671263|L|-41.2890112|174.767253',
      '12|1|VERTEX|24.841||||-41.289067|174.767303',
      '9|1|OA|26.0|-41.2891657|174.7671712|L|-41.2891595|174.7673103'
    ]);

    t.end();
  });
};

module.exports.functional.search = function(test) {

  // connect to databases
  var conn = search( paths.db.address, paths.db.street );

  test('search: exact', function(t) {

    var coord = { lat: -41.288788, lon: 174.766843 }
    var number = '18';
    var street = 'glasgow street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'exact',
        source: 'OA',
        number: '18',
        lat: -41.2887878,
        lon: 174.7668435
      });
      t.end();
    });
  });

  test('search: close', function(t) {

    var coord = { lat: -41.288788, lon: 174.766843 }
    var number = '18a';
    var street = 'glasgow street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'close',
        source: 'OA',
        number: '18',
        lat: -41.2887878,
        lon: 174.7668435
      });
      t.end();
    });
  });

  test('search: interpolated', function(t) {

    var coord = { lat: -41.288788, lon: 174.766843 }
    var number = '16';
    var street = 'glasgow street';

    conn.query( coord, number, street, function( err, res ){
      t.false( err );
      t.deepEqual( res, {
        type: 'interpolated',
        source: 'mixed',
        number: '16',
        lat: -41.2886487,
        lon: 174.7670925
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
  action.geojson(test, paths, 'id=1');
};

// write tsv to disk
module.exports.functional.tsv = function(test) {
  action.tsv(test, paths, 'id=1');
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: basic: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
