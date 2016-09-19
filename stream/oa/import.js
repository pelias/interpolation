
var through = require('through2'),
    polyline = require('polyline'),
    project = require('../../lib/project');

// polyline precision
var PRECISION = 6;

function streamFactory(db, done){

  // vanity statistics
  var total_saved = 0;

  // sqlite3 prepared statements
  var statement = {
    address: db.prepare("INSERT INTO street_address (rowid, id, source, housenumber, lat, lon, proj_lat, proj_lon) VALUES (NULL, $id, $source, $housenumber, $lat, $lon, $proj_lat, $proj_lon);")
  };

  // create a new stream
  return through.obj({ highWaterMark: 8 }, function( lookup, _, next ){

    // vanity statistics
    total_saved += 1;
    // console.error( total_saved );

    // @todo: select best row instead of first (unlikely to find >1 anyway)
    // could choose longest or closest instead?
    var firstStreetMatch = lookup.matched[0];

    // decode polyline
    var linestring = polyline.toGeoJSON(firstStreetMatch.line, PRECISION).coordinates;

    db.parallelize(function(){

      // store an array of housenumbers and their distance along the linestring
      var distances = [];

      // process all house number entries in batch
      lookup.batch.forEach( function( item ){

        // @note: removes letters such as '2a' -> 2
        var housenumber = parseFloat( item.NUMBER );

        // if the house number is followed by a single letter [a-i] then we
        // add a fraction to the house number representing the offset.
        // @todo: tests for this
        var apartment = item.NUMBER.match(/^[0-9]+([abcdefghi])$/);
        if( apartment ){
          var offset = apartment[1].charCodeAt(0) - 96; // gives a:1, b:2 etc..
          housenumber += offset / 10; // add fraction to housenumber for apt;
        }

        // project point on to line string
        var point = [ parseFloat(item.LON), parseFloat(item.LAT) ];
        var proj = project.pointOnLine( linestring, point );

        // compute the distance along the linestring to the projected point (in meters)
        var dist = project.lineDistance( project.sliceLineAtProjection( linestring, proj ) );
        distances.push({ housenumber: housenumber, dist: dist });

        // insert openaddresses values in db
        statement.address.run({
          $id: lookup.matched[0].id,
          $source: 'OA',
          $housenumber: housenumber,
          $lon: point[0].toFixed(7),
          $lat: point[1].toFixed(7),
          $proj_lon: proj.point[0].toFixed(7),
          $proj_lat: proj.point[1].toFixed(7)
        }, function(){
          // debug
          process.stderr.write('.');
        });
      });


      // ensure distances are sorted by distance ascending
      distances.sort( function( a, b ){
        return a.dist > b.dist;
      });

      // insert each point on linestring in table
      // note: this allows us to ignore the linestring and simply linearly
      // interpolation between matched values at query time.
      linestring.forEach( function( vertex, i ){

        // not a line, just a single point;
        if( 0 === i ){ return; }

        // ignore successive duplicate points in linestring
        if( vertex[0] === linestring[i-1][0] &&vertex[1] === linestring[i-1][1] ){
          return;
        }

        // distance along line to vertex
        var dist = project.lineDistance( linestring.slice(0, i+1) );

        // projected fractional housenumber
        var housenumber;

        // cycle through calculated distances and interpolate a fractional housenumber
        // value which would sit at this vertex.
        for( var x=0; x<distances.length-1; x++ ){

          var thisDist = distances[x],
              nextDist = distances[x+1];

          // the vertex distance is less that the lowest housenumber
          // @extrapolation
          if( dist < thisDist.dist ){
            break;
          }

          // vertex distance is between two house number distance
          if( nextDist.dist > dist ){
            var ratio = (dist - thisDist.dist) / (nextDist.dist - thisDist.dist);
            // console.error( 'ratio', ratio );
            var minHouseNumber = Math.min( thisDist.housenumber, nextDist.housenumber );
            var maxHouseNumber = Math.max( thisDist.housenumber, nextDist.housenumber );
            housenumber = minHouseNumber + (( maxHouseNumber - minHouseNumber ) * ( 1-ratio ));
          }

          // else the vertex is greater than the highest housenumber
          // @extrapolation
        }

        // skip undefined housenumbers
        if( !housenumber ){
          return;
        }

        // insert point values in db
        statement.address.run({
          $id: lookup.matched[0].id,
          $source: 'VERTEX',
          $housenumber: housenumber.toFixed(3),
          $lon: undefined,
          $lat: undefined,
          $proj_lon: vertex[0].toFixed(7),
          $proj_lat: vertex[1].toFixed(7)
        }, function(){
          // debug
          process.stderr.write('.');
        });
      });

      next();

    });

  }, function(){

    // finalize prepared statement
    statement.address.finalize(onError);
  });
}

// generic error handler
function onError( title ){
  return function( err ){
    if( err ){
      console.error( "stmt " + title + ": " + err );
    }
  };
}

module.exports = streamFactory;
