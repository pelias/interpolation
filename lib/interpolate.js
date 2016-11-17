
function interpolate( addrPoints, vertexDistance ){

  // cycle through calculated addrPoints and interpolate a fractional housenumber
  // value which would sit at this vertexDistance.
  for( var x=0; x<addrPoints.length-1; x++ ){

    var thisAddr = addrPoints[x],
        nextAddr = addrPoints[x+1];

    // the vertex vertexDistance is less that the lowest housenumber
    // @extrapolation
    if( vertexDistance < thisAddr.dist ){ return null; }

    // vertex vertexDistance is between two house number vertexDistance
    if( nextAddr.dist > vertexDistance ){
      var ratio = ((vertexDistance - thisAddr.dist) / (nextAddr.dist - thisAddr.dist));

      // invert ratio if the street was drawn from high house number to low
      if( thisAddr.housenumber > nextAddr.housenumber ){ ratio = 1 - ratio; }

      if( ratio >= 1 || ratio <= 0 ){ break; } // will result in a duplicate value
      var minHouseNumber = Math.min( thisAddr.housenumber, nextAddr.housenumber );
      var maxHouseNumber = Math.max( thisAddr.housenumber, nextAddr.housenumber );

      // house numbers are only a single number apart
      // see: https://github.com/pelias/interpolation/issues/6
      if( maxHouseNumber <= ( minHouseNumber + 1 )){ return null; }

      // return fractional housenumber
      return minHouseNumber + (( maxHouseNumber - minHouseNumber ) * ratio);
    }

    // else the vertex is greater than the highest housenumber
    // @extrapolation
  }
  return null;
}

module.exports = interpolate;
