
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
    return parseInt( res, 10 );
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

module.exports.functional.street_counts = function(test) {
  test('street db table counts', function(t) {

    // count polyline table
    var polylines = sqlite3.count( db.street, 'polyline' );
    t.equal(polylines, 144);

    // count names table
    var names = sqlite3.count( db.street, 'names' );
    t.equal(names, 165);

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
