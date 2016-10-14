
/**
  geodesic functions, javascript versions of aviation formulary:
  http://williams.best.vwh.net/avform.htm

  note: all point values are in radians, not degrees
**/

/**
  distance between point A and point B (in radians)
**/
function distance( a, b ){
  return Math.acos( Math.sin( a.lat ) * Math.sin( b.lat ) +
    Math.cos( a.lat ) * Math.cos( b.lat ) * Math.cos( a.lon - b.lon ));
}

/**
  distance between point A and point B (in radians)

  note: for very short distances this version is less susceptible to rounding error
**/
function distance2( a, b ){
  return 2 * Math.asin( Math.sqrt( Math.pow( Math.sin(( a.lat - b.lat ) / 2 ), 2 ) +
    Math.cos( a.lat ) * Math.cos( b.lat ) * Math.pow( Math.sin(( a.lon - b.lon ) / 2), 2)));
}

/**
  course from point A and point B (in radians)
**/
function course( a, b, d ){
  return Math.acos(
    ( Math.sin( b.lat ) - Math.sin( a.lat ) * Math.cos( d )) /
    ( Math.sin( d ) * Math.cos( a.lat ) )
  );
}

/**
  cross track error (distance off course)

  (positive XTD means right of course, negative means left)
**/
function crossTrack( d, crs1, crs2, A, B, D ){

  var calc = ( crs1 - crs2 );

  // north pole / south pole
  if( A.lat === +90 ){ calc = ( D.lon - B.lon ); }
  if( A.lat === -90 ){ calc = ( B.lon - D.lon ); }

  return Math.asin( Math.sin( d ) * Math.sin( calc ) );
}

/**
  along track distance (the distance from A along the course towards B to the point abeam D)
**/
function alongTrack( d, xtd ){
  return Math.acos( Math.cos( d ) / Math.cos( xtd ) );
}

/**
  along track distance (the distance from A along the course towards B to the point abeam D)

  note: for very short distances this version is less susceptible to rounding error
**/
function alongTrack2( d, xtd ){
  return Math.asin( Math.sqrt( Math.pow( Math.sin( d ), 2 ) - Math.pow( Math.sin( xtd ), 2 ) ) / Math.cos( xtd ) );
}

/**
  interpolate f (percent) of the distance d along path A-B
**/
function interpolate( d, f, a, b ){
  var A = Math.sin( (1-f) * d ) / Math.sin( d );
  var B = Math.sin( f * d ) / Math.sin( d );
  var X = A * Math.cos( a.lat ) * Math.cos( a.lon ) + B * Math.cos( b.lat ) * Math.cos( b.lon );
  var Y = A * Math.cos( a.lat ) * Math.sin( a.lon ) + B * Math.cos( b.lat ) * Math.sin( b.lon );
  var Z = A * Math.sin( a.lat ) + B * Math.sin( b.lat );
  return {
    lat: Math.atan2( Z, Math.sqrt( Math.pow( X, 2 ) + Math.pow( Y, 2 ) ) ),
    lon: Math.atan2( Y, X )
  };
}

/**
  calculate the distance a using b and C

       c
  A -------B
   \       |
    \      |
     \b    |a
      \    |
       \   |
        \  |
         \C|
          \|

  Napier's rules: tan(a) = tan(b)*cos(C)
**/
function project( b, C ){
  return Math.atan( Math.tan( b ) * Math.cos( C ) );
}

module.exports.distance = distance;
module.exports.distance2 = distance2;
module.exports.course = course;
module.exports.crossTrack = crossTrack;
module.exports.alongTrack = alongTrack;
module.exports.alongTrack2 = alongTrack2;
module.exports.interpolate = interpolate;
module.exports.project = project;
