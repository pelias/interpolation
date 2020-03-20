const Database = require('better-sqlite3');
const query = { extract: require('../query/extract') };
const analyze = require('../lib/analyze');
const asyncForEach = require('../lib/asyncForEach');

// export setup method
function setup( addressDbPath, streetDbPath ){

  // connect to db
  const db = new Database(addressDbPath, { readonly: true });

  // attach street database
  db.exec(`ATTACH DATABASE '${streetDbPath}' as 'street'`);

  // query method
  var q = async function( coord, names, cb ){

    var point = {
      lat: parseFloat( coord.lat ),
      lon: parseFloat( coord.lon )
    };

    var normalized = [];
    await asyncForEach(names, async (name) => {
      normalized = normalized.concat( await analyze.street( name ) );
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
