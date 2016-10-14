
var path = require('path'),
    sqlite3 = require('../sqlite3'),
    action = require('../action');

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
    t.equal(polylines, 7, 'count(polyline)');

    // count names table
    var names = sqlite3.count( paths.db.street, 'names' );
    t.equal(names, 14, 'count(names)');

    // count rtree table
    var rtree = sqlite3.count( paths.db.street, 'rtree' );
    t.equal(rtree, 7, 'count(rtree)');

    t.end();
  });
};

module.exports.functional.address_counts = function(test) {
  test('address db table counts', function(t) {

    // count address table
    var addresses = sqlite3.count( paths.db.address, 'address' );
    t.equal(addresses, 286, 'count(address)');

    t.end();
  });
};

module.exports.functional.spotcheck = function(test) {
  test('spot checks', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1' );
    t.equal(count1, 20);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1 AND source="OA"' );
    t.equal(count2, 19);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( paths.db.address, 'address', 'WHERE id=1 AND source="VERTEX"' );
    t.equal(count3, 1);

    t.end();
  });
};

module.exports.functional.end_to_end = function(test) {
  test('end to end', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( paths.db.address, 'SELECT * FROM address WHERE id=1 ORDER BY housenumber' );
    t.deepEqual(rows, [
      '128|1|OA|1.0|52.5177791|13.6103671|R|52.517383|13.610976',
      '129|1|OA|1.3|52.5174643|13.6115383|R|52.5172552|13.6113399',
      '130|1|OA|2.0|52.5172862|13.611788|R|52.5171448|13.6116539',
      '131|1|OA|3.0|52.5171927|13.6120221|R|52.5170598|13.611896',
      '165|1|OA|4.0|52.5171337|13.6122929|R|52.5169737|13.612141',
      '132|1|OA|5.0|52.5170198|13.6124793|R|52.5168958|13.6123629',
      '155|1|OA|6.0|52.5169006|13.6126842|R|52.5168128|13.6126018',
      '133|1|OA|7.0|52.5169162|13.6130219|R|52.5167281|13.6128455',
      '154|1|OA|8.0|52.5167787|13.6131743|R|52.5166544|13.6130577',
      '153|1|OA|8.2|52.5167194|13.6134767|R|52.5165606|13.6133277',
      '164|1|OA|20.3|52.5164624|13.6132975|L|52.5165444|13.6133744',
      '162|1|OA|20.4|52.5165316|13.6129705|L|52.5166471|13.6130788',
      '147|1|OA|21.0|52.5166205|13.6127002|L|52.5167397|13.6128121',
      '148|1|OA|22.0|52.5167276|13.612413|L|52.5168413|13.6125197',
      '166|1|VERTEX|22.032||||52.516902|13.612345',
      '149|1|OA|22.1|52.5169002|13.6118499|L|52.517032|13.611975',
      '150|1|OA|23.0|52.5170268|13.6115706|L|52.5171373|13.6116754',
      '151|1|OA|23.1|52.5171384|13.6112546|L|52.5172484|13.611359',
      '152|1|OA|23.2|52.5172095|13.6110445|L|52.5173216|13.6111508',
      '127|1|OA|24.0|52.5174789|13.6101585|L|52.517383|13.610976'
    ]);

    t.end();
  });
};

// write geojson to disk
module.exports.functional.geojson = function(test) {
  action.geojson(test, paths, 'id=4');
};

// write tsv to disk
module.exports.functional.tsv = function(test) {
  action.tsv(test, paths, 'id=4');
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: ambiguous_street_name: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
