
var through = require('through2'),
    polyline = require('polyline'),
    project = require('../../lib/project'),
    analyze = require('../../lib/analyze'),
    interpolate = require('../../lib/interpolate');

// polyline precision
var PRECISION = 6;

/**
  this stream performs all the interpolation math for a road segment and pushes
  downstream rows to be inserted in the 'street_address' table.
**/
function streamFactory(db, done){

  // create a new stream
  return through.obj(function( lookup, _, next ){

    // decode polylines
    lookup.streets.forEach( function( street, i ){
      street.coordinates = project.dedupe( polyline.toGeoJSON(street.line, PRECISION).coordinates );
    });

    // process all house number entries in batch
    lookup.batch.forEach( function( address ){

      // parse housenumber
      var housenumber = analyze.housenumber( address.getNumber() );

      // invalid / unusual housenumber
      if( isNaN( housenumber ) ){
        console.error( 'could not reliably parse housenumber', address.getNumber() );
        return;
      }

      // project point on to line string
      var point = [ address.getCoord().lon, address.getCoord().lat ];

      // pick correct street to use (in case of multiple matches)
      var nearest = { projection: { dist: Infinity }, street: undefined };

      lookup.streets.forEach( function( street, i ){
        var proj = project.pointOnLine( street.coordinates, point );

        // validate projection
        if( !proj || !proj.edge || !proj.point || proj.dist === Infinity ){
          console.error( 'unable to project point on to linestring' );
          console.error( 'street', street );
          console.error( 'point', point );
          return;
        }

        // check if this is the nearest projection
        if( proj.dist < nearest.projection.dist ){
          nearest.projection = proj;
          nearest.street = street;
          nearest.index = i;
        }
      });

      // ensure we have a valid street match
      if( !nearest.street || nearest.projection.dist === Infinity ){
        console.error( 'unable to find nearest street for point' );
        console.error( 'streets', lookup.streets );
        console.error( 'address', address );
        return;
      }

      // compute L/R parity of house on street
      var parity = project.parity( nearest.projection, point );

      // push openaddresses values to db
      this.push({
        $id: nearest.street.id,
        $source: address.getSource(),
        $housenumber: housenumber,
        $lon: point[0],
        $lat: point[1],
        $parity: parity,
        $proj_lon: nearest.projection.point[0],
        $proj_lat: nearest.projection.point[1]
      });

    }, this);

    next();
  });
}

module.exports = streamFactory;
