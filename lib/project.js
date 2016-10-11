
var geodesic = require('./geodesic');

/**
  project point p on to edge v, u

  V ◯ - - x - - - - ◯ U
          ┋
          ◯ P

  note: all values should be arrays of: [ lon, lat ]
**/

function pointOnEdge( v, u, p ){

  var lon_scale = Math.cos( p[1] * ( Math.PI / 180 ) );

  var bx = v[0] - u[0];
  var by = v[1] - u[1];

  var bx2 = bx * lon_scale;
  var sq = bx2*bx2 + by*by;

  var scale = ( sq > 0 ) ? (( (p[0] - u[0])*lon_scale*bx2 + (p[1] - u[1])*by ) / sq) : 0.0;

  if( scale <= 0.0 ){
    bx = u[0];
    by = u[1];
  }
  else if( scale >= 1.0 ){
    bx = v[0];
    by = v[1];
  }
  else {
    bx = bx*scale + u[0];
    by = by*scale + u[1];
  }

  return [bx, by];
}

/**
  project point p on to closest edge of linestring

  ◯ - - x - - - - ◯ - - - ◯ - - - ◯
        ┋
        ◯ P

**/
function pointOnLine( linestring, p ){

  // shortest distance found
  var d = Infinity;

  // point to return
  var r;

  // edge the projection was performed on
  var e;

  for( var x=0; x<linestring.length-1; x++ ){

    var a = linestring[x];
    var b = linestring[x+1];

    // project point on to edge A-B
    var pp = pointOnEdge( a, b, p );

    // calculate the distance between proj and p
    var dist = distance( pp, p );

    // select the projection with the shortest distance from p
    if( dist < d ){
      d = dist;
      r = pp;
      e = [ a, b ];
    }
  }

  // return the projected point and the matching edge
  return { point: r, edge: e, dist: d };
}

/**
  Calculate the distance between two points (in degrees)

  ◯ < - - - > ◯ ?

**/

function distance( a, b ){
  return toDeg( geodesic.distance2(
    { lon: toRad( a[0] ), lat: toRad( a[1] ) },
    { lon: toRad( b[0] ), lat: toRad( b[1] ) }
  ));
}

/*
  sort coordinate array so the two extremes are the first and last element,
  the rest of the array is ordered by distance from those points.

  input: [{ lat: 0.0, lon: 0.0 }, ...]
  output: same format
*/
function sort( coords ){
  switch( coords.length ){
    case 0: return coords;
    case 1: return coords;
    case 2: return coords;
    default:
      var maxDist = 0, end = coords[0];

      // find two extremes (points fathest apart from each other)
      for( var x=0; x<coords.length; x++ ){
        for( var y=x+1; y<coords.length; y++ ){
          var d = distance(
            [ coords[x].lon, coords[x].lat ],
            [ coords[y].lon, coords[y].lat ]
          );
          if( d > maxDist ){
            maxDist = d;
            end = coords[x];
          }
        }
      }

      // calculate distances from p1
      var sorted = coords.map( function( coord ){
        coord.dist = distance( [ end.lon, end.lat ], [ coord.lon, coord.lat ] );
        return coord;
      });

      // sort distances ascending
      sorted.sort( function( a, b ){
        return a.dist - b.dist;
      });

      return sorted;
  }
}

/*
  compute the bounding box of an array of coordinates

  input: [{ lat: 0.0, lon: 0.0 }, ...]
  output: { lat: { min: 0.0, max: 0.0 }, lon: { min: 0.0, max: 0.0 } }
*/
function bbox( coords ){
  return coords.reduce( function( memo, c ){
    if( c.lat > memo.lat.max ){ memo.lat.max = c.lat; }
    if( c.lat < memo.lat.min ){ memo.lat.min = c.lat; }
    if( c.lon > memo.lon.max ){ memo.lon.max = c.lon; }
    if( c.lon < memo.lon.min ){ memo.lon.min = c.lon; }
    return memo;
  }, {
    lat: { min: +Infinity, max: -Infinity },
    lon: { min: +Infinity, max: -Infinity }
  });
}

/**
  Calculate the distance (in degrees) of linestring

  ◯ < - ◯ - - ◯ - - ◯ - > ◯ m?

**/
function lineDistance( linestring ){
  return linestring.reduce( function( d, v, i ){
    if( i === linestring.length -1 ){ return d; }
    return d + distance( linestring[i], linestring[i+1] );
  }, 0);
}

/**
  Copy linestring points until projection, then add the projected point and
  discard all other line edges from matched edge onwards.

  in:  ◯ - - ◯ - - ◯ - - ◯
  out: ◯ - - ◯ - P

**/
function sliceLineAtProjection( linestring, proj ){
  var ret = [];
  for( var x=0; x<linestring.length; x++ ){
    var corner = linestring[x];
    if( corner[0] === proj.edge[1][0] && corner[1] === proj.edge[1][1] ){
      ret.push( proj.point );
      return ret;
    }
    ret.push( corner );
  }
  return ret;
}

/**
  Compute the left/right parity of the projected point relative to the line direction.

  in:  output of pointOnLine()
  out: either 'L' or 'R'.. or null in the case where no true answer exists (on the line).

  @see: https://www.cs.cmu.edu/~quake/robust.html
**/
function parity( proj, point ){

  // validate inputs
  if( !proj || !proj.edge || !point ){ return null; }

  var acx = proj.edge[0][0] - point[0];
  var bcx = proj.edge[1][0] - point[0];
  var acy = proj.edge[0][1] - point[1];
  var bcy = proj.edge[1][1] - point[1];
  var xprod = acx * bcy - acy * bcx;

  // xprod is 0 on the line <0 on the right and >0 on the left
  if( xprod === 0 ){ return null; }
  return xprod < 0 ? 'R' : 'L';
}

function bearing( p1, p2 ){
  var lon1 = toRad(p1[0]), lon2 = toRad(p2[0]);
  var lat1 = toRad(p1[1]), lat2 = toRad(p2[1]);
  var a = Math.sin(lon2 - lon1) * Math.cos(lat2);
  var b = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  return toDeg(Math.atan2(a, b));
}

// deduplicate an array or coordinates in geojson [ [ lon, lat ] ... ] format.
function dedupe( coordinates ){
  return coordinates.filter( function( coord, i ){
    if( 0 === i ){ return true; }
    if( coord[0] !== coordinates[i-1][0] ){ return true; }
    if( coord[1] !== coordinates[i-1][1] ){ return true; }
    return false;
  });
}

function toRad(degree) { return degree * Math.PI / 180; }
function toDeg(radian) { return radian * 180 / Math.PI; }

module.exports.pointOnLine = pointOnLine;
module.exports.pointOnEdge = pointOnEdge;
module.exports.distance = distance;
module.exports.sort = sort;
module.exports.bbox = bbox;
module.exports.lineDistance = lineDistance;
module.exports.sliceLineAtProjection = sliceLineAtProjection;
module.exports.parity = parity;
module.exports.bearing = bearing;
module.exports.dedupe = dedupe;
module.exports.toRad = toRad;
module.exports.toDeg = toDeg;
