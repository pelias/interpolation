
var through = require('through2'),
    polyline = require('polyline'),
    codec = require('../../lib/codec');

// polyline precision
var PRECISION = 6;

function streamFactory(){
  return through.obj({ highWaterMark: 32 }, function( msg, _, next ){

    // parse polyline row
    var parsed = parse( msg );

    // valid row
    if( parsed ){

      // push parsed row data downstream
      this.push( parsed );
    }

    next();
  });
}

/**
  attempt to parse data row, returns:
  on success: { names: Array, bbox: Array, line: String }
  on error: undefined
**/
function parse( row ){

  // split data in to columns
  var cols = row.toString('utf8') // convert buffer to utf8 string
                .split('\0') // split on delimeter
                .filter(function(x){ return x; }); // remove empty columns

  // run parser
  try {
    // must contain a polyline and at least one name
    if( cols.length > 2 ){

      return {
        id: cols[0],
        names: cols.slice(2),
        bbox: bboxify( polyline.decode( cols[1], PRECISION ) ),
        line: cols[1]
      };

    } else if( cols.length ) {
      console.error( 'invalid polyline row', row );
    }
  } catch( e ){
    console.error( 'polyline parsing error', e );
  }
}

/*
  return bbox.
  note: same format as 'geojson-extent' without format shifting to geojson first.
*/
function bboxify( coords ){

  // compute coordinate extremes
  var minLat = Infinity; var maxLat = -Infinity;
  var minLng = Infinity; var maxLng = -Infinity;

  coords.forEach( function( coord ){

    // latitude
    if( coord[0] > maxLat ){
      maxLat = coord[0];
    }
    if( coord[0] < minLat ){
      minLat = coord[0];
    }

    // longitude
    if( coord[1] > maxLng ){
      maxLng = coord[1];
    }
    if( coord[1] < minLng ){
      minLng = coord[1];
    }
  });

  return [ minLng, minLat, maxLng, maxLat ]; // [WSEN]
}

module.exports = streamFactory;
