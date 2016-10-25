
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    query = requireDir('../query'),
    project = require('../lib/project'),
    geodesic = require('../lib/geodesic'),
    analyze = require('../lib/analyze');

// export setup method
function setup( addressDbPath, streetDbPath ){

  // connect to db
  sqlite3.verbose();
  var db = new sqlite3.Database( addressDbPath, sqlite3.OPEN_READONLY );

  // attach street database
  query.attach( db, streetDbPath, 'street' );

  // query method
  var q = function( coord, number, street, cb ){

    var point = {
      lat: parseFloat( coord.lat ),
      lon: parseFloat( coord.lon )
    };

    if( 'string' !== typeof number ){ return cb( 'invalid number' ); }
    if( 'string' !== typeof street ){ return cb( 'invalid street' ); }

    var normalized = {
      number: analyze.housenumber( number ),
      street: analyze.street( street )
    };

    // error checking
    if( isNaN( point.lat ) ){ return cb( 'invalid latitude' ); }
    if( isNaN( point.lon ) ){ return cb( 'invalid longitude' ); }
    if( isNaN( normalized.number ) ){ return cb( 'invalid number' ); }
    if( !normalized.street.length ){ return cb( 'invalid street' ); }

    // perform a db lookup for the specified street
    // @todo: perofmance: only query for part of the table
    query.search( db, point, normalized.number, normalized.street, function( err, res ){

      // @todo: results can be from multiple different street ids!
      // possibly not an issue? except maybe where there is a dual
      // carriageway and then the projection would be on the median strip.

      // an error occurred or no results were found
      if( err || !res || !res.length ){ return cb( err, null ); }

      // try to find an exact match
      var match = res.find( function( row ){
        if( row.source === 'VERTEX' ){ return false; }
        return row.housenumber === normalized.number;
      });

      // return exact match
      if( match ){
        return cb( null, {
          type: 'exact',
          source: match.source,
          number: analyze.housenumberFloatToString( match.housenumber ),
          lat: match.lat,
          lon: match.lon
        });
      }

      // try to find a close match with the same number (possibly an apartment)
      match = res.find( function( row ){
        if( row.source === 'VERTEX' ){ return false; }
        return Math.floor( row.housenumber ) === Math.floor( normalized.number );
      });

      // return close match
      if( match ){
        return cb( null, {
          type: 'close',
          source: match.source,
          number: analyze.housenumberFloatToString( match.housenumber ),
          lat: match.lat,
          lon: match.lon
        });
      }

      // attempt to interpolate the position

      // find the records before and after the desired number
      var before, after;
      for( var i=0; i<res.length; i++ ){
        var row = res[i];
        if( row.housenumber < normalized.number ){ before = row; }
        if( row.housenumber > normalized.number ){ after = row; break; }
      }

      // could not find two rows to use for interpolation
      if( !before || !after ){
        return cb( null, null );
      }

      // compute interpolated address
      var ratio = ((normalized.number - before.housenumber) / (after.housenumber - before.housenumber));
      var A = { lat: project.toRad( before.proj_lat ), lon: project.toRad( before.proj_lon ) };
      var B = { lat: project.toRad( after.proj_lat ), lon: project.toRad( after.proj_lon ) };
      var distance = geodesic.distance( A, B );
      var point = geodesic.interpolate( distance, ratio, A, B );

      // return interpolated address
      return cb( null, {
        type: 'interpolated',
        source: 'mixed',
        number: '' + Math.floor( normalized.number ),
        lat: parseFloat( project.toDeg( point.lat ).toFixed(7) ),
        lon: parseFloat( project.toDeg( point.lon ).toFixed(7) )
      });
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
