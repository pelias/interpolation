
var through = require('through2'),
    quadtree = require('quadtree');

// combine records on the same street in to a single batch
// so the street geometry needs to only be looked up once.

// a quadtree precision of 14 should be adequate to group most/all points on the
// same street while avoiding grouping streets with the same name in the same city.
// see: http://mapzen.github.io/leaflet-spatial-prefix-tree/
var QUADTREE_PRECISION = 14;

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
    if( !csvrow || !csvrow.NUMBER || csvrow.NUMBER === '0' || !csvrow.STREET || !csvrow.LON || !csvrow.LAT ){
      console.error( 'invalid csv row', csvrow );
      return next();
    }

    // parse floating point numbers
    csvrow.LAT = parseFloat( csvrow.LAT );
    csvrow.LON = parseFloat( csvrow.LON );

    // invalid lat/lon values
    if( isNaN( csvrow.LAT ) || isNaN( csvrow.LON ) ){
      console.error( 'invalid coordinates', csvrow );
      return next();
    }

    // group similar entries from the same street together; note: there may be
    // consecutive values which should not legitimately be grouped. (eg. where
    // the file has been sorted lexicographically and a city has two streets with
    // the same name).
    // note: regional metadata from the csv row can be missing/unreliable so we
    // use a spatial index to group like entities instead.
    var hash = [
      csvrow.STREET.toLowerCase(),
      quadtree.encode({ lng: csvrow.LON, lat: csvrow.LAT }, QUADTREE_PRECISION)
    ].join('|');

    // hash changed
    if( hash !== currentHash ){

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

  }, function flush( next ){
    // @todo: write unit tests for this
    // tested manually and confirmed it gets pushed downstream
    this.push( batch ); // flush last batch
    next();
  });
}

module.exports = streamFactory;
