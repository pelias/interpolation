
var through = require('through2'),
    polyline = require('polyline'),
    project = require('../../lib/project');

// polyline precision
var PRECISION = 6;

/**
  this stream performs all the interpolation math for a road segment and pushes
  downstream rows to be inserted in the 'street_address' table.
**/
function streamFactory(db, done){

  // create a new stream
  return through.obj(function( lookup, _, next ){

    // store an array of housenumbers and their distance along the linestring
    // per linestring
    var distances = [];

    // decode polylines
    lookup.streets.forEach( function( street, i ){
      street.coordinates = polyline.toGeoJSON(street.line, PRECISION).coordinates;
      distances[i] = []; // init array
    });

    // process all house number entries in batch
    lookup.batch.forEach( function( item ){

      // remove spaces from housenumber. eg: '2 A' -> '2A'
      var number = item.NUMBER.replace(/\s+/g, '').toLowerCase();

      // @note: removes letters such as '2a' -> 2
      var housenumber = parseFloat( number );

      // if the house number is followed by a single letter [a-i] then we
      // add a fraction to the house number representing the offset.
      // @todo: tests for this
      var apartment = number.match(/^[0-9]+([abcdefghi])$/);
      if( apartment ){
        var offset = apartment[1].charCodeAt(0) - 96; // gives a:1, b:2 etc..
        housenumber += ( offset / 10 ); // add fraction to housenumber for apt;
      }

      // project point on to line string
      var point = [ parseFloat(item.LON), parseFloat(item.LAT) ];

      // pick correct street to use (in case of multiple matches)
      var nearest = { projection: { dist: Infinity }, street: [] };
      lookup.streets.forEach( function( street, i ){
        var proj = project.pointOnLine( street.coordinates, point );
        if( proj.dist < nearest.projection.dist ){
          nearest.projection = proj;
          nearest.street = street;
          nearest.index = i;
        }
      });

      // compute the distance along the linestring to the projected point
      var dist = project.lineDistance( project.sliceLineAtProjection( nearest.street.coordinates, nearest.projection ) );
      distances[nearest.index].push({ housenumber: housenumber, dist: dist });

      // push openaddresses values to db
      this.push({
        $id: nearest.street.id,
        $source: 'OA',
        $housenumber: housenumber,
        $lon: point[0].toFixed(7),
        $lat: point[1].toFixed(7),
        $proj_lon: nearest.projection.point[0].toFixed(7),
        $proj_lat: nearest.projection.point[1].toFixed(7)
      });

    }, this);

    // ensure distances are sorted by distance ascending
    distances = distances.map( function( d ){
      return d.sort( function( a, b ){
        return a.dist > b.dist;
      });
    });

    // loop over all linestrings
    lookup.streets.forEach( function( street, si ){

      // distance travelled along the line string
      var distance = 0;

      // insert each point on linestring in table
      // note: this allows us to ignore the linestring and simply linearly
      // interpolation between matched values at query time.
      street.coordinates.forEach( function( vertex, i ){

        // not a line, just a single point;
        if( 0 === i ){ return; }

        // ignore successive duplicate points in linestring
        var previousVertex = street.coordinates[i-1];
        if( previousVertex && vertex[0] === previousVertex[0] && vertex[1] === previousVertex[1] ){
          return;
        }

        // distance along line to this vertex
        var edge = street.coordinates.slice(i-2, i);
        if( edge.length == 2 ){
          distance += project.lineDistance( edge );
        }

        // projected fractional housenumber
        var housenumber;

        // cycle through calculated distances and interpolate a fractional housenumber
        // value which would sit at this vertex.
        for( var x=0; x<distances[si].length-1; x++ ){

          var thisDist = distances[si][x],
              nextDist = distances[si][x+1];

          // the vertex distance is less that the lowest housenumber
          // @extrapolation
          if( distance < thisDist.dist ){
            break;
          }

          // vertex distance is between two house number distance
          if( nextDist.dist > distance ){
            var ratio = 1 - ((distance - thisDist.dist) / (nextDist.dist - thisDist.dist));
            if( ratio >= 1 || ratio <= 0 ){ break; } // will result in a duplicate value
            var minHouseNumber = Math.min( thisDist.housenumber, nextDist.housenumber );
            var maxHouseNumber = Math.max( thisDist.housenumber, nextDist.housenumber );
            housenumber = minHouseNumber + (( maxHouseNumber - minHouseNumber ) * ratio);
            break;
          }

          // else the vertex is greater than the highest housenumber
          // @extrapolation
        }

        // skip undefined housenumbers
        if( !housenumber ){
          return;
        }

        // insert point values in db
        this.push({
          $id: street.id,
          $source: 'VERTEX',
          $housenumber: housenumber.toFixed(3),
          $lon: undefined,
          $lat: undefined,
          $proj_lon: vertex[0].toFixed(7),
          $proj_lat: vertex[1].toFixed(7)
        });

      }, this);
    }, this);

    next();
  });
}

module.exports = streamFactory;
