
var through = require('through2'),
    postal = require('node-postal'),
    polyline = require('polyline'),
    project = require('../../lib/project');

// polyline precision
var PRECISION = 6;

var sql = [
  "SELECT street_polyline.id, street_names.name, street_polyline.line FROM street_polyline",
  "JOIN street_rtree ON street_rtree.id = street_polyline.id",
  "JOIN street_names ON street_names.id = street_rtree.id",
  "WHERE ( street_rtree.minX<=? AND street_rtree.maxX>=? AND street_rtree.minY<=? AND street_rtree.maxY>=? )",
  "AND ( street_names.name = ?"
];

// { LON: '174.5805754',
//   LAT: '-36.1037843',
//   NUMBER: '30A',
//   STREET: 'Thelma Road South',
//   UNIT: '',
//   CITY: 'Mangawhai Heads',
//   DISTRICT: '',
//   REGION: 'Kaipara District',
//   POSTCODE: '',
//   ID: '1939485',
//   HASH: '' }

/*
$ sqlite3 example.db "select id, * from street_rtree WHERE ( street_rtree.minX<=174.7668435 AND street_rtree.maxX>=174.7668435 AND street_rtree.minY<=-41.2887878 AND street_rtree.maxY>=-41.2887878 );"
136|136|174.765075683594|174.768371582031|-41.2904777526855|-41.2861595153809
*/

function streamFactory(db){

  // prepared statement
  var statement = {
    address: db.prepare("INSERT INTO street_address (rowid, id, source, housenumber, lat, lon, proj_lat, proj_lon) VALUES (NULL, $id, $source, $housenumber, $lat, $lon, $proj_lat, $proj_lon);")
  };

  return through.obj(function( batch, _, next ){

    // invalid batch
    if( !batch || !batch.length ){
      return next();
    }

    // we could potentially use any batch member?
    // so just choose the first since it doesn't matter.
    var firstBatchSesult = batch[0];

    // all street names in batch should be the same
    var streetName = firstBatchSesult.STREET;

    // perform libpostal normalization
    var names = postal.expand.expand_address( streetName );

    // ensure at least one name was produced
    if( !names.length ){
      return next();
    }

    // copy base query and add OR statements for multiple names
    var query = sql.slice();
    for( var x=1; x<names.length; x++ ){
      query.push("OR street_names.name = ?");
    }
    query.push(")"); // close OR group

    // create a variable array of args to bind to query
    var args = [
      query.join(" ") + ";",
      firstBatchSesult.LON, firstBatchSesult.LON,
      firstBatchSesult.LAT, firstBatchSesult.LAT
    ].concat(names);

    // call db.all(), appending the callback function
    db.all.apply(db, args.concat(function( err, rows ){

      /**
      [ { id: 9155,
          name: 'elizabeth street',
          line: 't}e`rA}cdehIcI_dCuJsnC[iIWiJ{Ko|DgMkdEuLcyC' } ]
      **/

      if( rows && rows.length ){

        // @todo: select best row instead of first (unlikely to find >1 anyway)
        // could choose longest or closest instead?
        var firstStreetMatch = rows[0];

        // decode polyline
        var linestring = polyline.toGeoJSON(firstStreetMatch.line, PRECISION).coordinates;

        db.parallelize(function(){

          // store an array of housenumbers and their distance along the linestring
          var distances = [];

          // process all house number entries in batch
          batch.forEach( function( item ){

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
              $id: rows[0].id,
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
              $id: rows[0].id,
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

        });
      }

      setTimeout(next, 1); // yield CPU to sqlite (or it won't write to disk)
    }));

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
