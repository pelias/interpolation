
var through = require('through2'),
    Street = require('../../lib/Street');

// polyline precision
var PRECISION = 6;

function streamFactory(){
  return through.obj(function( row, _, next ){

    // parse polyline row
    var parsed = parse( row );

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

      var street = new Street();
      street.setId( cols[0] )
            .setNames( cols.slice(2) )
            .setEncodedPolyline( cols[1], PRECISION );

      return street;

    } else if( cols.length ) {
      console.error( 'invalid polyline row', row );
    }
  } catch( e ){
    console.error( 'polyline parsing error', e );
  }
}

module.exports = streamFactory;
