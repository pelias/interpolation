
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

  // enable memmapping of database pages
  db.run('PRAGMA mmap_size=268435456;');
  db.run('PRAGMA street.mmap_size=268435456;');

  // query method
  var q = function( coord, number, street, cb ){

    var point = {
      lat: parseFloat( coord.lat ),
      lon: parseFloat( coord.lon )
    };

    if( 'string' !== typeof number ){ return cb( 'invalid number' ); }
    if( 'string' !== typeof street ){ return cb( 'invalid street' ); }

    analyze.street(street, function streetAnalyzeCallback(err, street, metadata) {

      var normalized = {
        number: analyze.housenumber( number ),
        street: street
      };

      // error checking
      if( isNaN( point.lat ) ){ return cb( 'invalid latitude' ); }
      if( isNaN( point.lon ) ){ return cb( 'invalid longitude' ); }
      if( isNaN( normalized.number ) ){ return cb( 'invalid number' ); }
      if( !normalized.street.length ){ return cb( 'invalid street' ); }

      // perform a db lookup for the specified street
      // @todo: perofmance: only query for part of the table
      query.search( db, point, normalized.number, normalized.street, function( err, res ){

        // @note: results can be from multiple different street ids.

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
            source_id: match.source_id,
            number: analyze.housenumberFloatToString( match.housenumber ),
            lat: parseFloat( match.lat.toFixed(7) ),
            lon: parseFloat( match.lon.toFixed(7) )
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
            source_id: match.source_id,
            number: analyze.housenumberFloatToString( match.housenumber ),
            lat: parseFloat( match.lat.toFixed(7) ),
            lon: parseFloat( match.lon.toFixed(7) )
          });
        }

        // attempt to interpolate the position

        // find the records before and after the desired number (group by street segment)
        var map = {};
        res.forEach( function( row ){
          if( !map.hasOwnProperty( row.id ) ){ map[row.id] = {}; }
          if( row.housenumber < normalized.number ){ map[row.id].before = row; }
          if( row.housenumber > normalized.number ){ map[row.id].after = row; }
          if( map[row.id].before && map[row.id].after ){
            map[row.id].diff = {
              before: map[row.id].before.housenumber - normalized.number,
              after: map[row.id].after.housenumber - normalized.number
            };
          }
        });

        // remove segments with less than 2 points; convert map to array
        var segments = [];
        for( var id in map ){
          if( map[id].before && map[id].after ){
            segments.push( map[id] );
          }
        }

        // could not find two rows to use for interpolation
        if( !segments.length ){
          return cb( null, null );
        }

        // sort by miniumum housenumber difference from target housenumber ASC
        segments.sort( function( a, b ){
          return Math.abs( a.diff.before + a.diff.after ) - Math.abs( b.diff.before + b.diff.after );
        });

        // select before/after values to use for the interpolation
        var before = segments[0].before;
        var after = segments[0].after;

        // compute interpolated address
        var A = { lat: project.toRad( before.proj_lat ), lon: project.toRad( before.proj_lon ) };
        var B = { lat: project.toRad( after.proj_lat ), lon: project.toRad( after.proj_lon ) };
        var distance = geodesic.distance( A, B );

        // if distance = 0 then we can simply use either A or B (they are the same lat/lon)
        // else we interpolate between the two positions
        var point = A;
        if( distance > 0 ){
          var ratio = ((normalized.number - before.housenumber) / (after.housenumber - before.housenumber));
          point = geodesic.interpolate( distance, ratio, A, B );
        }

        // return interpolated address
        return cb( null, {
          type: 'interpolated',
          source: 'mixed',
          number: '' + Math.floor( normalized.number ),
          lat: parseFloat( project.toDeg( point.lat ).toFixed(7) ),
          lon: parseFloat( project.toDeg( point.lon ).toFixed(7) )
        });
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
