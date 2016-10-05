
var path = require('path'),
    sqlite3 = require('../sqlite3'),
    action = require('../action');

var fixture = {
  oa: path.resolve( __dirname, './oa.csv' ),
  street: path.resolve( __dirname, './osm.polylines' )
};

var db = {
  address: path.resolve( __dirname, './address.db' ),
  street: path.resolve( __dirname, './street.db' )
};

module.exports.functional = {};

// import data
module.exports.functional.import = function(test) {
  action.import(test, db, fixture);
};

// perform conflation
module.exports.functional.conflate = function(test) {
  action.conflate(test, db, fixture);
};

// check table schemas
module.exports.functional.schema = function(test) {
  action.check.schema(test, db);
};

// check table indexes
module.exports.functional.indexes = function(test) {
  action.check.indexes(test, db);
};

module.exports.functional.street_counts = function(test) {
  test('street db table counts', function(t) {

    // count polyline table
    var polylines = sqlite3.count( db.street, 'polyline' );
    t.equal(polylines, 144, 'count(polyline)');

    // count names table
    var names = sqlite3.count( db.street, 'names' );
    t.equal(names, 165, 'count(names)');

    // count rtree table
    var rtree = sqlite3.count( db.street, 'rtree' );
    t.equal(rtree, 144, 'count(rtree)');

    t.end();
  });
};

module.exports.functional.address_counts = function(test) {
  test('address db table counts', function(t) {

    // count address table
    var addresses = sqlite3.count( db.address, 'address' );
    t.equal(addresses, 497, 'count(address)');

    t.end();
  });
};

module.exports.functional.spotcheck = function(test) {
  test('spot checks', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( db.address, 'address', 'WHERE id=137' );
    t.equal(count1, 25);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( db.address, 'address', 'WHERE id=137 AND source="OA"' );
    t.equal(count2, 11);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( db.address, 'address', 'WHERE id=137 AND source="VERTEX"' );
    t.equal(count3, 14);

    t.end();
  });
};

module.exports.functional.end_to_end = function(test) {
  test('end to end', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( db.address, 'SELECT * FROM address WHERE id=137 ORDER BY housenumber' );
    t.deepEqual(rows, [
      '80|137|OA|1.0|-41.2871999|174.766753|R|-41.2873014|174.7666946',
      '100|137|VERTEX|2.373||||-41.287388|174.766845',
      '99|137|VERTEX|3.207||||-41.287461|174.766921',
      '98|137|VERTEX|3.959||||-41.287533|174.766983',
      '97|137|VERTEX|4.637||||-41.287606|174.767028',
      '85|137|OA|7.0|-41.2877481|174.7674712|R|-41.2878827|174.7671406',
      '86|137|OA|9.0|-41.2878189|174.7673061|R|-41.2878858|174.7671419',
      '96|137|VERTEX|9.599||||-41.287945|174.767166',
      '76|137|OA|10.0|-41.2882585|174.7670996|L|-41.2882844|174.7672309',
      '92|137|VERTEX|10.378||||-41.288304|174.767227',
      '77|137|OA|11.0|-41.2880114|174.7674035|R|-41.2880839|174.7672213',
      '95|137|VERTEX|11.773||||-41.288136|174.767242',
      '78|137|OA|12.0|-41.2884049|174.7670334|L|-41.2884589|174.7671618',
      '94|137|VERTEX|12.242||||-41.28817|174.767242',
      '93|137|VERTEX|13.042||||-41.288228|174.767242',
      '91|137|VERTEX|14.14||||-41.288487|174.76715',
      '90|137|VERTEX|15.758||||-41.288567|174.76712',
      '89|137|VERTEX|17.598||||-41.288659|174.767089',
      '79|137|OA|18.0|-41.2887878|174.7668435|L|-41.288758|174.767089',
      '88|137|VERTEX|18.602||||-41.288712|174.767089',
      '87|137|VERTEX|19.473||||-41.288758|174.767089',
      '81|137|OA|20.0|-41.2888927|174.7667798|L|-41.2887843|174.767098',
      '82|137|OA|22.0|-41.2889696|174.7667528|L|-41.288845|174.7671186',
      '83|137|OA|24.0|-41.2890752|174.7671263|L|-41.2889837|174.7672284',
      '84|137|OA|26.0|-41.2891657|174.7671712|L|-41.2891548|174.7673099'
    ]);

    t.end();
  });
};


// write geojson to disk
module.exports.functional.geojson = function(test) {

  // destination path
  var destination = path.resolve(__dirname, 'preview.geojson');

  action.geojson(test, db, 'id=137', destination);
};

// write tsv to disk
module.exports.functional.tsv = function(test) {

  // destination path
  var destination = path.resolve(__dirname, 'preview.tsv');

  action.tsv(test, db, 'id=137', destination);
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: basic: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
