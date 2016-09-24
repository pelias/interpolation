
var fs = require('fs'),
    path = require('path'),
    sqlite3 = require('./sqlite3'),
    child = require('child_process'),
    pretty = require('../../lib/pretty');

var exec = {
  import: path.resolve( __dirname, '../../import.js' ),
  oa: path.resolve( __dirname, '../../conflate_oa.js' )
};

module.exports.import = function(test, db, fixture) {
  test('import', function(t) {

    // perform import
    var cmd = [ 'rm -f', db.street, ';', 'cat', fixture.street, '|', 'node', exec.import, db.street ].join(' ');

    // spawn child process
    child.spawnSync( 'sh', [ '-c', cmd ] );

    t.pass('perform import');
    t.end();
  });
};

module.exports.conflate = function(test, db, fixture) {
  test('conflate', function(t) {

    // perform conflation
    var cmd = [ 'rm -f', db.address, ';', 'cat', fixture.oa, '|', 'node', exec.oa, db.address, db.street ].join(' ');

    // spawn child process
    child.spawnSync( 'sh', [ '-c', cmd ] );

    t.pass('perform conflate');
    t.end();
  });
};

module.exports.check = {};

module.exports.check.schema = function(test, db) {
  test('street db table schemas', function(t) {

    // polyline schema
    var polyline = sqlite3.exec( db.street, 'PRAGMA table_info(polyline)' );
    t.deepEqual(polyline, [
      '0|id|INTEGER|0||1',
      '1|line|TEXT|0||0'
    ], 'table_info(polyline)');

    // names schema
    var names = sqlite3.exec( db.street, 'PRAGMA table_info(names)' );
    t.deepEqual(names, [
      '0|rowid|INTEGER|0||1',
      '1|id|INTEGER|0||0',
      '2|name|TEXT|0||0'
    ], 'table_info(names)');

    // rtree schema
    var rtree = sqlite3.exec( db.street, 'PRAGMA table_info(rtree)' );
    t.deepEqual(rtree, [
      '0|id||0||0',
      '1|minX||0||0',
      '2|maxX||0||0',
      '3|minY||0||0',
      '4|maxY||0||0'
    ], 'table_info(rtree)');

    t.end();
  });

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
      '6|parity|TEXT|0||0',
      '7|proj_lat|REAL|0||0',
      '8|proj_lon|REAL|0||0'
    ], 'table_info(address)');

    t.end();
  });
};

module.exports.check.indexes = function(test, db) {
  test('street db table indexes', function(t) {

    // names_id_idx index
    var namesId = sqlite3.exec( db.street, 'PRAGMA index_info(names_id_idx)' );
    t.deepEqual(namesId, ['0|1|id'], 'index_info(names_id_idx)');

    // names_name_idx index
    var namesName = sqlite3.exec( db.street, 'PRAGMA index_info(names_name_idx)' );
    t.deepEqual(namesName, ['0|2|name'], 'index_info(names_name_idx)');

    t.end();
  });

  test('address db table indexes', function(t) {

    // address_id_idx index
    var addressId = sqlite3.exec( db.address, 'PRAGMA index_info(address_id_idx)' );
    t.deepEqual(addressId, ['0|1|id'], 'index_info(address_id_idx)');

    // address_source_idx index
    var addressSource = sqlite3.exec( db.address, 'PRAGMA index_info(address_source_idx)' );
    t.deepEqual(addressSource, ['0|2|source'], 'index_info(address_source_idx)');

    // address_parity_idx index
    var addressParity = sqlite3.exec( db.address, 'PRAGMA index_info(address_parity_idx)' );
    t.deepEqual(addressParity, ['0|6|parity'], 'index_info(address_parity_idx)');

    // address_housenumber_idx index
    var addressHousenumber = sqlite3.exec( db.address, 'PRAGMA index_info(address_housenumber_idx)' );
    t.deepEqual(addressHousenumber, ['0|3|housenumber'], 'index_info(address_housenumber_idx)');

    t.end();
  });
};

module.exports.geojson = function(test, db, condition, destination) {
  test('produce geojson', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( db.address, 'SELECT * FROM address WHERE ' + condition + ' ORDER BY housenumber' );

    // convert to geojson
    var geojson = pretty.geojson( rows.map( function( row ){
      return row.split('|');
    }).map( function( row ){
      return {
        // rowid:        row[0],
        // id:           parseInt( row[1], 10),
        source:       row[2],
        housenumber:  parseFloat( row[3] ),
        lat:          parseFloat( row[4] ),
        lon:          parseFloat( row[5] ),
        parity:       row[6],
        proj_lat:     parseFloat( row[7] ),
        proj_lon:     parseFloat( row[8] )
      };
    }));

    // write to disk
    fs.writeFileSync( destination, geojson );

    t.pass('wrote geojson');
    t.end();
  });
};

module.exports.tsv = function(test, db, condition, destination) {
  test('produce tsv', function(t) {

    // full interpolation for a single street
    var rows = sqlite3.exec( db.address, 'SELECT * FROM address WHERE ' + condition + ' ORDER BY housenumber' );

    // convert to tsv
    var tsv = rows.map( function( row ){
      return row.split('|').join('\t');
    }).join('\n');

    // tsv header
    var header = [
      'rowid', 'id', 'source', 'housenumber', 'lat', 'lon',
      'parity', 'proj_lat', 'proj_lon'
    ].join('\t');

    // write to disk
    fs.writeFileSync( destination, header + '\n' + tsv );

    t.pass('wrote tsv');
    t.end();
  });
};
