
var through = require('through2'),
    postal = require('node-postal');

var CONCURRENCY_OPTIONS = { maxConcurrency: 8 };

// increase/decrease bbox bounds by this much
// in order to find houses which might be slighly
// outside the bounds.
var FUDGE_FACTOR = 0.001;

// auto increment
var inc = 0;

function streamFactory(){
  return through.obj({ highWaterMark: 32 }, function( parsed, _, next ){

    // push augmented data downstream
    this.push( map( parsed, inc ) );
    inc++; // auto increment

    next();
  });
}

function map( parsed, id ){

  var names = [];
  parsed.names.forEach( function( name ){
    names = names.concat( postal.expand.expand_address( name ) );
  });

  return {
    id: id,
    line: parsed.line,
    // geom: wellknown.stringify(parsed.geojson),
    minX: parsed.bbox[0] -FUDGE_FACTOR,
    minY: parsed.bbox[1] -FUDGE_FACTOR,
    maxX: parsed.bbox[2] +FUDGE_FACTOR,
    maxY: parsed.bbox[3] +FUDGE_FACTOR,
    names: names
  };
}

module.exports = streamFactory;
