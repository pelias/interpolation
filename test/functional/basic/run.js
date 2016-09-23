
var path = require('path'),
    child = require('child_process'),
    sqlite3 = require('../sqlite3');

var fixture = {
  oa: path.resolve( __dirname, './oa.csv' ),
  street: path.resolve( __dirname, './osm.polylines' )
};

var db = {
  address: path.resolve( __dirname, './address.db' ),
  street: path.resolve( __dirname, './street.db' )
};

var exec = {
  import: path.resolve( __dirname, '../../../import.js' ),
  oa: path.resolve( __dirname, '../../../conflate_oa.js' )
};

module.exports.functional = {};

module.exports.functional.import = function(test) {
  test('import', function(t) {

    // perform import
    var cmd = [ 'rm -f', db.street, ';', 'cat', fixture.street, '|', 'node', exec.import, db.street ].join(' ');

    // spawn child process
    var proc = child.spawn( 'sh', [ '-c', cmd ] );
    proc.stdout.on( 'end', t.end );
  });
};

module.exports.functional.street_schema = function(test) {
  test('street db table schemas', function(t) {

    // polyline schema
    var polyline = sqlite3.exec( db.street, 'PRAGMA table_info(polyline)' );
    t.deepEqual(polyline, [
      '0|id|INTEGER|0||1',
      '1|line|TEXT|0||0'
    ]);

    // names schema
    var names = sqlite3.exec( db.street, 'PRAGMA table_info(names)' );
    t.deepEqual(names, [
      '0|rowid|INTEGER|0||1',
      '1|id|INTEGER|0||0',
      '2|name|TEXT|0||0'
    ]);

    // rtree schema
    var rtree = sqlite3.exec( db.street, 'PRAGMA table_info(rtree)' );
    t.deepEqual(rtree, [
      '0|id||0||0',
      '1|minX||0||0',
      '2|maxX||0||0',
      '3|minY||0||0',
      '4|maxY||0||0'
    ]);

    t.end();
  });
};

module.exports.functional.street_indexes = function(test) {
  test('street db table indexes', function(t) {

    // names_id_idx index
    var namesId = sqlite3.exec( db.street, 'PRAGMA index_info(names_id_idx)' );
    t.deepEqual(namesId, ['0|1|id']);

    // names_name_idx index
    var namesName = sqlite3.exec( db.street, 'PRAGMA index_info(names_name_idx)' );
    t.deepEqual(namesName, ['0|2|name']);

    t.end();
  });
};

module.exports.functional.street_counts = function(test) {
  test('street db table counts', function(t) {

    // count polyline table
    var polylines = sqlite3.count( db.street, 'polyline' );
    t.equal(polylines, 144);

    // count names table
    var names = sqlite3.count( db.street, 'names' );
    t.equal(names, 165);

    // count rtree table
    var rtree = sqlite3.count( db.street, 'rtree' );
    t.equal(rtree, 144);

    t.end();
  });
};

module.exports.functional.conflate = function(test) {
  test('conflate', function(t) {

    // perform conflation
    var cmd = [ 'rm -f', db.address, ';', 'cat', fixture.oa, '|', 'node', exec.oa, db.address, db.street ].join(' ');

    // spawn child process
    var proc = child.spawn( 'sh', [ '-c', cmd ] );
    proc.stdout.on( 'end', t.end );
  });
};

module.exports.functional.address_schema = function(test) {
  test('address db table schemas', function(t) {

    // address schema
    var address = sqlite3.exec( db.address, 'PRAGMA table_info(address)' );
    t.deepEqual(address, [
      '0|rowid|INTEGER|0||1',
      '1|id|INTEGER|0||0',
      '2|source|TEXT|0||0',
      '3|housenumber|REAL|0||0',
      '4|lat|REAL|0||0',
      '5|lon|REAL|0||0',
      '6|proj_lat|REAL|0||0',
      '7|proj_lon|REAL|0||0'
    ]);

    t.end();
  });
};

module.exports.functional.address_indexes = function(test) {
  test('address db table indexes', function(t) {

    // address_id_idx index
    var addressId = sqlite3.exec( db.address, 'PRAGMA index_info(address_id_idx)' );
    t.deepEqual(addressId, ['0|1|id']);

    // address_source_idx index
    var addressSource = sqlite3.exec( db.address, 'PRAGMA index_info(address_source_idx)' );
    t.deepEqual(addressSource, ['0|2|source']);

    // address_housenumber_idx index
    var addressHousenumber = sqlite3.exec( db.address, 'PRAGMA index_info(address_housenumber_idx)' );
    t.deepEqual(addressHousenumber, ['0|3|housenumber']);

    t.end();
  });
};

module.exports.functional.address_counts = function(test) {
  test('address db table counts', function(t) {

    // count address table
    var addresses = sqlite3.count( db.address, 'address' );
    t.equal(addresses, 489);

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
      '80|137|OA|1.0|-41.2871999|174.766753|-41.2873014|174.7666946',
      '100|137|VERTEX|2.237|||-41.287388|174.766845',
      '99|137|VERTEX|3.042|||-41.287461|174.766921',
      '98|137|VERTEX|3.787|||-41.287533|174.766983',
      '97|137|VERTEX|4.486|||-41.287606|174.767028',
      '85|137|OA|7.0|-41.2877481|174.7674712|-41.2878827|174.7671406',
      '86|137|OA|9.0|-41.2878189|174.7673061|-41.2878858|174.7671419',
      '96|137|VERTEX|9.599|||-41.287945|174.767166',
      '76|137|OA|10.0|-41.2882585|174.7670996|-41.2882844|174.7672309',
      '92|137|VERTEX|10.384|||-41.288304|174.767227',
      '77|137|OA|11.0|-41.2880114|174.7674035|-41.2880839|174.7672213',
      '95|137|VERTEX|11.765|||-41.288136|174.767242',
      '78|137|OA|12.0|-41.2884049|174.7670334|-41.2884589|174.7671618',
      '94|137|VERTEX|12.243|||-41.28817|174.767242',
      '93|137|VERTEX|13.059|||-41.288228|174.767242',
      '91|137|VERTEX|14.104|||-41.288487|174.76715',
      '90|137|VERTEX|15.715|||-41.288567|174.76712',
      '89|137|VERTEX|17.555|||-41.288659|174.767089',
      '79|137|OA|18.0|-41.2887878|174.7668435|-41.288758|174.767089',
      '88|137|VERTEX|18.582|||-41.288712|174.767089',
      '87|137|VERTEX|19.474|||-41.288758|174.767089',
      '81|137|OA|20.0|-41.2888927|174.7667798|-41.2887843|174.767098',
      '82|137|OA|22.0|-41.2889696|174.7667528|-41.288845|174.7671186',
      '83|137|OA|24.0|-41.2890752|174.7671263|-41.2889837|174.7672284',
      '84|137|OA|26.0|-41.2891657|174.7671712|-41.2891548|174.7673099'
    ]);

    t.end();
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: basic: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
