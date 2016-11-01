
var through = require('through2');

// combine rows from the same street in to a single batch.

// { id: 9231408,
//   line: 'qtgmsAzpxmgDtm@?l@]^m@LkB]iuA',
//   rowid: 8,
//   source: 'OA',
//   housenumber: 1006,
//   lat: 44.2734319,
//   lon: -88.3226101,
//   parity: 'L',
//   proj_lat: 44.2734319,
//   proj_lon: -88.322846 }
// { id: 9231408,
//   line: 'qtgmsAzpxmgDtm@?l@]^m@LkB]iuA',
//   rowid: 9,
//   source: 'OA',
//   housenumber: 1008,
//   lat: 44.2734318,
//   lon: -88.3225263,
//   parity: 'L',
//   proj_lat: 44.2732185,
//   proj_lon: -88.3225218 }

function streamFactory(){

  var currentId;
  var batch = [];

  return through.obj(function( dbrow, _, next ){

    // invalid row
    if( !dbrow || !dbrow.id ){
      console.error( 'invalid address row' );
      return next();
    }

    if( dbrow.id !== currentId ){

      // flush previous batch, reset
      if( batch.length ){
        this.push( batch );
        batch = []; // reset
      }

      // update current hash
      currentId = dbrow.id;
    }

    // add row to batch
    batch.push( dbrow );

    next();

  }, function flush( next ){
    // @todo: write unit tests for this
    // tested manually and confirmed it gets pushed downstream
    this.push( batch ); // flush last batch
    next();
  });
}

module.exports = streamFactory;
