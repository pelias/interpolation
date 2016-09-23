
var path = require('path'),
    child = require('child_process');

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

var sqlite3 = {
  count: function( dbpath, table, conditions ){
    conditions = ( conditions || '' ).replace(/\"/g, '\\"');
    var cmd = [ 'sqlite3', dbpath, '"SELECT COUNT(*) FROM', table, conditions, ';"' ];
    var res = child.execSync( cmd.join(' '), { encoding: 'utf8' } );
    return parseInt( res.trim(), 10 );
  },
  exec: function( dbpath, sql ){
    sql = sql.replace(/\"/g, '\\"');
    var cmd = [ 'sqlite3', dbpath, '"', sql, ';"' ];
    var res = child.execSync( cmd.join(' '), { encoding: 'utf8' } );
    return res.trim().split('\n');
  }
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

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('functional: ' + name, testFunction);
  }

  for( var testCase in module.exports.functional ){
    module.exports.functional[testCase](test);
  }
};
