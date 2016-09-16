
var concurrent = require('through2-concurrent'),
    polyline = require('polyline'),
    extent = require('geojson-extent');

var CONCURRENCY_OPTIONS = { maxConcurrency: 8 };

// polyline precision
var PRECISION = 6;

function streamFactory(){
  return concurrent.obj(CONCURRENCY_OPTIONS, function( row, _, next ){
    var parsed = parse( row );

    // invalid row
    if( !parsed || !parsed.hasOwnProperty('names') || !parsed.hasOwnProperty('bbox') || !parsed.hasOwnProperty('line') ){
      return next();
    }

    // push hash of data downstream
    this.push( parsed );

    next();
  });
}

function parse( row ){
  var cols = row.toString('utf8').split('\0').filter(function(x){ return x; });
  try {
    // must contain a polyline and at least one name
    if( cols.length > 1 ){

      // decode polyline
      var geojson = polyline.toGeoJSON(cols[0], PRECISION);

      return {
        names: cols.slice(1),
        bbox: extent( geojson ), // [WSEN]
        line: cols[0],
        // geojson: geojson
      };

    } else if( cols.length ) {
      console.error( 'invalid polyline row', row );
    }
  } catch( e ){
    console.error( 'polyline parsing error', e );
  }
}

module.exports = streamFactory;
