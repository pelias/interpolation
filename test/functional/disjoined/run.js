
var fs = require('fs'),
    path = require('path'),
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
    t.equal(polylines, 4, 'count(polyline)');

    // count names table
    var names = sqlite3.count( db.street, 'names' );
    t.equal(names, 8, 'count(names)');

    // count rtree table
    var rtree = sqlite3.count( db.street, 'rtree' );
    t.equal(rtree, 4, 'count(rtree)');

    t.end();
  });
};

module.exports.functional.address_counts = function(test) {
  test('address db table counts', function(t) {

    // count address table
    var addresses = sqlite3.count( db.address, 'address' );
    t.equal(addresses, 47, 'count(address)');

    t.end();
  });
};

module.exports.functional.spotcheck_north = function(test) {
  test('spot check: north side', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( db.address, 'address', 'WHERE id=1' );
    t.equal(count1, 27);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( db.address, 'address', 'WHERE id=1 AND source="OA"' );
    t.equal(count2, 22);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( db.address, 'address', 'WHERE id=1 AND source="VERTEX"' );
    t.equal(count3, 5);

    t.end();
  });
};

module.exports.functional.end_to_end_north = function(test) {
  test('end to end: north side', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( db.address, 'SELECT * FROM address WHERE id=1 ORDER BY housenumber' );
    t.deepEqual(rows, [
      '1|1|OA|14.0|52.5087751|13.3197845|L|52.50893|13.319979',
      '2|1|OA|14.1|52.5086354|13.3198981|L|52.5087927|13.320091',
      '46|1|VERTEX|14.285||||52.508762|13.320116',
      '3|1|OA|15.0|52.5084885|13.3200177|L|52.5086419|13.3202112',
      '4|1|OA|16.0|52.5081581|13.3198748|L|52.5085085|13.3203169',
      '5|1|OA|16.1|52.5082819|13.3201859|L|52.5084331|13.3203767',
      '6|1|OA|17.0|52.5081537|13.3202902|L|52.5083036|13.3204793',
      '45|1|VERTEX|17.024||||52.50827|13.320506',
      '7|1|OA|18.0|52.5079936|13.3204206|L|52.5081415|13.3206076',
      '8|1|OA|19.0|52.5078514|13.3205362|L|52.5079977|13.3207213',
      '44|1|VERTEX|19.87||||52.507606|13.321031',
      '9|1|OA|20.0|52.5076588|13.3206779|L|52.5078103|13.3208695',
      '43|1|VERTEX|20.616||||52.507431|13.321167',
      '42|1|VERTEX|20.983||||52.507347|13.321237',
      '10|1|OA|21.0|52.5071733|13.3210882|L|52.507314|13.3212635',
      '11|1|OA|22.0|52.5069494|13.3212704|L|52.507089|13.3214442',
      '12|1|OA|23.0|52.5067409|13.32144|L|52.5068794|13.3216125',
      '31|1|OA|50.0|52.5067516|13.3219716|R|52.5066261|13.3218172',
      '32|1|OA|51.0|52.5070123|13.3217595|R|52.5068884|13.3216053',
      '33|1|OA|52.0|52.5072582|13.3215594|R|52.5071356|13.3214068',
      '34|1|OA|53.0|52.5075021|13.3213608|R|52.5073776|13.3212115',
      '35|1|OA|54.0|52.5075497|13.3213222|R|52.5074247|13.3211722',
      '36|1|OA|55.0|52.5077825|13.3211361|R|52.5076635|13.3209856',
      '37|1|OA|56.0|52.5080292|13.3209319|R|52.5079146|13.320787',
      '38|1|OA|57.0|52.5082468|13.3207726|R|52.508126|13.3206198',
      '39|1|OA|58.0|52.5084363|13.3206005|R|52.5083261|13.3204615',
      '40|1|OA|59.0|52.5086452|13.3204313|R|52.5085368|13.3202945'
    ]);

    t.end();
  });
};


module.exports.functional.spotcheck_south = function(test) {
  test('spot check: south side', function(t) {

    // counts for a specific street
    var count1 = sqlite3.count( db.address, 'address', 'WHERE id=2' );
    t.equal(count1, 20);

    // counts for a specific street (open addresses)
    var count2 = sqlite3.count( db.address, 'address', 'WHERE id=2 AND source="OA"' );
    t.equal(count2, 19);

    // counts for a specific street (vertexes)
    var count3 = sqlite3.count( db.address, 'address', 'WHERE id=2 AND source="VERTEX"' );
    t.equal(count3, 1);

    t.end();
  });
};

module.exports.functional.end_to_end_south = function(test) {
  test('end to end: south side', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( db.address, 'SELECT * FROM address WHERE id=2 ORDER BY housenumber' );
    t.deepEqual(rows, [
      '13|2|OA|27.0|52.5046393|13.3231349|R|52.5047998|13.3233192',
      '14|2|OA|28.0|52.5044741|13.3232845|L|52.5046223|13.3234668',
      '15|2|OA|29.0|52.5042391|13.3234757|R|52.5043873|13.3236579',
      '47|2|VERTEX|29.739||||52.504745|13.323367',
      '16|2|OA|30.0|52.504004|13.3236668|R|52.5041523|13.3238491',
      '17|2|OA|31.0|52.5039014|13.3237503|R|52.5040496|13.3239326',
      '18|2|OA|32.0|52.5037822|13.3238472|R|52.5039304|13.3240295',
      '19|2|OA|33.0|52.5037196|13.3238982|R|52.5038678|13.3240804',
      '20|2|OA|35.0|52.5034993|13.3240774|R|52.5036475|13.3242596',
      '41|2|OA|36.0|52.5032985|13.3242406|R|52.5034467|13.3244229',
      '21|2|OA|39.0|52.5035259|13.324596|L|52.5034096|13.3244531',
      '22|2|OA|40.0|52.5037368|13.3244426|L|52.5036117|13.3242887',
      '23|2|OA|41.0|52.5039756|13.3242319|L|52.5038585|13.324088',
      '24|2|OA|42.0|52.5041548|13.3240857|L|52.504038|13.323942',
      '25|2|OA|43.0|52.5042048|13.324045|L|52.504088|13.3239014',
      '26|2|OA|44.0|52.5043478|13.3239275|L|52.5042316|13.3237846',
      '27|2|OA|45.0|52.5044245|13.3238652|L|52.5043082|13.3237222',
      '28|2|OA|46.0|52.5045378|13.323773|L|52.5044215|13.3236301',
      '29|2|OA|47.0|52.5046793|13.3236578|L|52.5045631|13.3235149',
      '30|2|OA|48.0|52.5050013|13.3234623|L|52.5048436|13.3232812'
    ]);

    t.end();
  });
};

// write geojson to disk
module.exports.functional.geojson = function(test) {

  // full interpolation for a single street
  var rows = sqlite3.exec( db.address, 'SELECT * FROM address WHERE ( id=1 OR id=2 ) ORDER BY housenumber' );

  // destination path
  var destination = path.resolve(__dirname, 'preview.geojson');

  action.geojson(test, rows, destination);
};

// write tsv to disk
module.exports.functional.tsv = function(test) {

  // full interpolation for a single street
  var rows = sqlite3.exec( db.address, 'SELECT * FROM address WHERE ( id=1 OR id=2 ) ORDER BY housenumber' );

  // destination path
  var destination = path.resolve(__dirname, 'preview.tsv');

  action.tsv(test, rows, destination);
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: disjoined: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
