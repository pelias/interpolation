
var through = require('through2'),
    polyline = require('polyline'),
    project = require('../../lib/project'),
    analyze = require('../../lib/analyze');

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

      // parse housenumber
      var housenumber = analyze.housenumber( item.NUMBER );

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

      // compute L/R parity of house on street
      var parity = project.parity( nearest.projection, point );

      // compute the distance along the linestring to the projected point
      var dist = project.lineDistance( project.sliceLineAtProjection( nearest.street.coordinates, nearest.projection ) );
      distances[nearest.index].push({ housenumber: housenumber, dist: dist, parity: parity });

      // push openaddresses values to db
      this.push({
        $id: nearest.street.id,
        $source: 'OA',
        $housenumber: housenumber,
        $lon: point[0].toFixed(7),
        $lat: point[1].toFixed(7),
        $parity: parity,
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

    /**
      compute the scheme (zig-zag vs. updown) of each road based on
      the house number parity.
      @see: https://en.wikipedia.org/wiki/House_numbering

      zigzag: 1   3   5   7   9
              └─┬─┴─┬─┴─┬─┴─┬─┘
                2   4   5   8

      updown: 1   2   3   4   5
              └─┬─┴─┬─┴─┬─┴─┬─┘
                9   8   7   6
    **/
    distances.forEach( function( d, i ){

      // store a memo of where the odd/even values lie
      var ord = {
        R: { odd: 0, even: 0, total: 0 },
        L: { odd: 0, even: 0, total: 0 }
      };

      // iterate distances to enumerate odd/even on L/R
      d.forEach( function( cur ){
        if( cur.parity && cur.housenumber ){
          var isEven = parseInt( cur.housenumber, 10 ) %2;
          if( isEven ){ ord[cur.parity].even++; }
          else { ord[cur.parity].odd++; }
          ord[cur.parity].total++;
        }
      });

      // zigzag schemes
      var zz1 = ( ord.R.odd == ord.R.total && ord.L.even == ord.L.total ),
          zz2 = ( ord.L.odd == ord.L.total && ord.R.even == ord.R.total );

      // assign correct scheme to street
      lookup.streets[i].scheme = ( zz1 || zz2 ) ? 'zigzag' : 'updown';
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
        var edge = street.coordinates.slice(i-1, i+1);
        if( edge.length == 2 ){
          distance += project.lineDistance( edge );
        }

        // projected fractional housenumber(s)
        var housenumbers = [];
        var num;

        // zigzag interpolation
        // (one vertex interpolation produced)
        if( street.scheme === 'zigzag' ){
          housenumbers.push( interpolate( distances[si], distance ) );
        }
        // updown interpolation
        // (two vertex interpolations produced)
        else {
          // left side
          housenumbers.push( interpolate( distances[si].filter( function( d ){
            return d.parity === 'L';
          }), distance ) );

          // right side
          housenumbers.push( interpolate( distances[si].filter( function( d ){
            return d.parity === 'R';
          }), distance ) );
        }

        // insert point values in db
        housenumbers.forEach( function( num ){
          if( !num ){ return; } // skip null interpolations
          this.push({
            $id: street.id,
            $source: 'VERTEX',
            $housenumber: num.toFixed(3),
            $lon: undefined,
            $lat: undefined,
            $parity: undefined,
            $proj_lon: vertex[0].toFixed(7),
            $proj_lat: vertex[1].toFixed(7)
          });
        }, this);

      }, this);
    }, this);

    next();
  });
}

function interpolate( distances, distance ){

  // cycle through calculated distances and interpolate a fractional housenumber
  // value which would sit at this vertex.
  for( var x=0; x<distances.length-1; x++ ){

    var thisDist = distances[x],
        nextDist = distances[x+1];

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
      return minHouseNumber + (( maxHouseNumber - minHouseNumber ) * ratio);
    }

    // else the vertex is greater than the highest housenumber
    // @extrapolation
  }
  return null;
}

module.exports = streamFactory;
