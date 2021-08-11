const Database = require('better-sqlite3');
const polyline = require('@mapbox/polyline');
const query = { near: require('../query/near') };
const project = require('../lib/project');
const proximity = require('../lib/proximity');

// polyline precision
const PRECISION = 6;

// export setup method
function setup( streetDbPath ){

  // connect to db
  // @todo: this is required as the query uses the 'street.' prefix for tables
  const db = new Database(':memory:');

  // attach street database
  db.exec(`ATTACH DATABASE '${streetDbPath}' as 'street'`);

  // query method
  var q = function( coord, cb ){

    var point = {
      lat: parseFloat( coord.lat ),
      lon: parseFloat( coord.lon )
    };

    // error checking
    if( isNaN( point.lat ) ){ return cb( 'invalid latitude' ); }
    if( isNaN( point.lon ) ){ return cb( 'invalid longitude' ); }

    try {
      // perform a db lookup for nearby streets
      const res = query.near( db, point );

      // no results were found
      if( !res || !res.length ){ return cb( null, null ); }

      // decode polylines
      res.forEach( function( street, i ){
        res[i].coordinates = project.dedupe( polyline.toGeoJSON(street.line, PRECISION).coordinates );
      });

      // order streets by proximity from point (by projecting it on to each line string)
      var ordered = proximity.nearest.street( res, [ point.lon, point.lat ] );

      // return streets ordered ASC by distance from point
      cb( null, ordered );
    } catch (err) {
      // an error occurred
      return cb(err, null);
    }
  };

  // return methods
  return {
    query: q,
    close: db.close.bind( db ),
  };
}

module.exports = setup;
