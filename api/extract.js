
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    pretty = require('../lib/pretty'),
    query = requireDir('../query'),
    analyze = require('../lib/analyze');

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

// export setup method
function setup( addressDbPath, streetDbPath ){

  // connect to db
  sqlite3.verbose();
  var db = new sqlite3.Database( addressDbPath, sqlite3.OPEN_READONLY );

  // attach street database
  query.attach( db, streetDbPath, 'street' );

  // query method
  var q = async function( coord, names, cb ){

    var point = {
      lat: parseFloat( coord.lat ),
      lon: parseFloat( coord.lon )
    };

    var normalized = [];
    await asyncForEach(names, async function( name ){
      normalized = normalized.concat( await analyze.street( name ) );
    });

    // error checking
    if( isNaN( point.lat ) ){ return cb( 'invalid latitude' ); }
    if( isNaN( point.lon ) ){ return cb( 'invalid longitude' ); }
    if( !normalized.length ){ return cb( 'invalid names' ); }

    // perform a db lookup for the specified street
    query.extract( db, point, normalized, cb );
  };

  // close method to close db
  var close = db.close.bind( db );

  // return methods
  return {
    query: q,
    close: close,
  };
}

module.exports = setup;
