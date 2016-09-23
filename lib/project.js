
/**
  project point p on to edge v, u

  V ◯ - - x - - - - ◯ U
          ┋
          ◯ P

  note: all values should be arrays of: [ lon, lat ]
**/

function pointOnEdge( v, u, p ){
  var bx = v[0] - u[0];
  var by = v[1] - u[1];
  var sq = bx*bx + by*by;

  var scale = ( sq > 0 ) ? (( (p[0] - u[0])*bx + (p[1] - u[1])*by ) / sq) : 0.0;

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
  Calculate the distance between two points (in the same units as the points)

  ◯ < - - - > ◯ ?

**/

function distance( a, b ){
  return Math.hypot( a[0]-b[0], a[1]-b[1] );
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

**/
function parity( proj, point ){

  // line bearing
  var l = bearing( proj.edge[0], proj.edge[1] );

  // point bearing
  var p = bearing( proj.edge[0], point );

  // radial offset
  var o = l - p;

  // point lies on path, we cannot assert parity
  if( o === 0 ){ return null; }

  // return L/R parity
  return o < 0 ? 'R' : 'L';
}

function bearing( p1, p2 ){
  var lon1 = toRad(p1[0]), lon2 = toRad(p2[0]);
  var lat1 = toRad(p1[1]), lat2 = toRad(p2[1]);
  var a = Math.sin(lon2 - lon1) * Math.cos(lat2);
  var b = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  return toDeg(Math.atan2(a, b));
}

function toRad(degree) { return degree * Math.PI / 180; }
function toDeg(radian) { return radian * 180 / Math.PI; }

module.exports.pointOnLine = pointOnLine;
module.exports.pointOnEdge = pointOnEdge;
module.exports.distance = distance;
module.exports.lineDistance = lineDistance;
module.exports.sliceLineAtProjection = sliceLineAtProjection;
module.exports.parity = parity;
module.exports.bearing = bearing;
