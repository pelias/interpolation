
var through = require('through2');

// combine records on the same street in to a single batch
// so the street geometry needs to only be looked up once.

// { LON: '174.5805754',
//   LAT: '-36.1037843',
//   NUMBER: '30A',
//   STREET: 'Thelma Road South',
//   UNIT: '',
//   CITY: 'Mangawhai Heads',
//   DISTRICT: '',
//   REGION: 'Kaipara District',
//   POSTCODE: '',
//   ID: '1939485',
//   HASH: '' }

function streamFactory(){

  var currentHash;
  var batch = [];

  return through.obj(function( csvrow, _, next ){

    // invalid row
    if( !csvrow || !csvrow.STREET || !csvrow.LON || !csvrow.LAT ){
      return next();
    }

    // street name changed
    // @note: it is not sufficient to only check the name as (in rare occasions)
    // there may be consecutive values which should not legitimately be grouped.
    var hash = [
      csvrow.STREET.toLowerCase(),
      csvrow.CITY.toLowerCase(),
      csvrow.DISTRICT.toLowerCase(),
      csvrow.REGION.toLowerCase()
    ].join('|');

    if( hash != currentHash ){

      // flush previous batch, reset
      if( batch.length ){
        this.push( batch );
        batch = []; // reset
      }

      // update current hash
      currentHash = hash;
    }

    // add row to batch
    batch.push( csvrow );

    next();

  }, function(){
    // @todo: write unit tests for this
    // tested manually and confirmed it gets pushed downstream
    this.push( batch ); // flush last batch
  });
}

module.exports = streamFactory;
