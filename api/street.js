
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    query = requireDir('../query');

// export setup method
function setup( streetDbPath ){

  // connect to db
  sqlite3.verbose();
  var db = new sqlite3.Database( streetDbPath, sqlite3.OPEN_READONLY );

  // query method
  var q = function( ids, cb ){

    if( !Array.isArray( ids ) || !ids.length ){ return cb( 'invalid ids' ); }

    // error checking
    var fail = false;
    ids = ids.map( function( id ){
      var i = parseInt( id, 10 );
      if( isNaN( i ) ){ fail = true; }
      return i;
    });
    if( fail ){ return cb( 'non-numeric id' ); }

    // perform a db lookup for the specified street
    query.street( db, ids, function( err, res ){

      // an error occurred or no results were found
      if( err || !res ){ return cb( err, null ); }

      // call callback
      cb( err, res );
    });
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
