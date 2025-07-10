const Database = require('better-sqlite3');
const polyline = require('@mapbox/polyline');
const query = { within: require('../query/within') };
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
  var q = function( topLeftCoord, bottomRightCoord, cb ){

    var topLeft = {
      lat: parseFloat( topLeftCoord.lat ),
      lon: parseFloat( topLeftCoord.lon )
    };

    var bottomRight = {
      lat: parseFloat( bottomRightCoord.lat ),
      lon: parseFloat( bottomRightCoord.lon )
    };

    // error checking
    if( isNaN( topLeft.lat ) ){ return cb( 'invalid latitude' ); }
    if( isNaN( topLeft.lon ) ){ return cb( 'invalid longitude' ); }

    if( isNaN( bottomRight.lat ) ){ return cb( 'invalid latitude' ); }
    if( isNaN( bottomRight.lon ) ){ return cb( 'invalid longitude' ); }

    try {
      // perform a db lookup for nearby streets
      const res = query.within( db, topLeft, bottomRight );

      // no results were found
      if( !res || !res.length ){ return cb( null, null ); }

      // decode polylines
      res.forEach( function( street, i ){
        res[i].coordinates = project.dedupe( polyline.toGeoJSON(street.line, PRECISION).coordinates );
      });

      var center = {
          lat: (topLeft.lat + bottomRight.lat) / 2,
          lon: (topLeft.lon + bottomRight.lon) / 2
        };

      // order streets by proximity from point (by projecting it on to each line string)
      var ordered = proximity.nearest.street( res, [ center.lon, center.lat ] );

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
