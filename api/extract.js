
var Database = require('better-sqlite3'),
    requireDir = require('require-dir'),
    query = requireDir('../query'),
    analyze = require('../lib/analyze');

// export setup method
function setup( addressDbPath, streetDbPath ){

  // connect to db
  var db = new Database( addressDbPath, {
    readonly: true,
    verbose: console.log
  });

  // attach street database
  db.exec(`ATTACH DATABASE '${streetDbPath}' as 'street'`);

  // query method
  var q = function( coord, names, cb ){

    var point = {
      lat: parseFloat( coord.lat ),
      lon: parseFloat( coord.lon )
    };

    var normalized = [];
    names.forEach( function( name ){
      normalized = normalized.concat( analyze.street( name ) );
    });

    // error checking
    if( isNaN( point.lat ) ){ return cb( 'invalid latitude' ); }
    if( isNaN( point.lon ) ){ return cb( 'invalid longitude' ); }
    if( !normalized.length ){ return cb( 'invalid names' ); }

    // perform a db lookup for the specified street
    try {
      const rows = query.extract( db, point, normalized );
      cb(null, rows);
    } catch (err) {
      // an error occurred
      return cb(err, null);
    }
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
