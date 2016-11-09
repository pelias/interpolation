
var project = require('./project');

/**
  find the nearest street to a specified point by projecting the point on to
  each input street and returning the streets ordered by distance ASC.

  param $streets: array of [ { coordinates: [ [ lon, lat ], [ lon, lat ],... ] } ]
  param $point: array of: [ lon, lat ]
**/

function street( streets, point ){

  var projections = [];

  // invalid streets
  if( !Array.isArray( streets ) || !streets.length || 'object' !== typeof streets[0] || null === streets[0] ){
    return projections;
  }

  // invalid point
  if( !Array.isArray( point ) || point.length !== 2 ){
    return projections;
  }

  streets.forEach( function( street ){
    var proj = project.pointOnLine( street.coordinates, point );

    // validate projection
    if( !proj || !proj.edge || !proj.point || proj.dist === Infinity ){
      console.error( 'unable to project point on to linestring' );
      console.error( 'street', street );
      console.error( 'point', point );
      return;
    }

    projections.push({ street: street, proj: proj });
  });

  // sort ASC
  projections.sort( function( a, b ){
    return a.proj.dist - b.proj.dist;
  });

  return projections;
}

module.exports.nearest = { street: street };
