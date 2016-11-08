
var through = require('through2'),
    quadtree = require('quadtree');

// combine records on the same street in to a single batch
// so the street geometry needs to only be looked up once.

// a quadtree precision of 14 should be adequate to group most/all points on the
// same street while avoiding grouping streets with the same name in the same city.
// see: http://mapzen.github.io/leaflet-spatial-prefix-tree/
var QUADTREE_PRECISION = 14;

function streamFactory(){

  var currentHash;
  var batch = [];

  return through.obj(function( address, _, next ){

    // invalid row
    if( !address || !address.isValid() ){
      console.error( 'invalid address', address );
      return next();
    }

    // group similar entries from the same street together; note: there may be
    // consecutive values which should not legitimately be grouped. (eg. where
    // the file has been sorted lexicographically and a city has two streets with
    // the same name).
    // note: regional metadata from the csv row can be missing/unreliable so we
    // use a spatial index to group like entities instead.
    var coord = address.getCoord();
    var quad = quadtree.encode({ lng: coord.lon, lat: coord.lat }, QUADTREE_PRECISION);
    var hash = [ address.getStreet().toLowerCase(), quad ].join('|');

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
    batch.push( address );

    next();

  }, function flush( next ){
    // @todo: write unit tests for this
    // tested manually and confirmed it gets pushed downstream
    this.push( batch ); // flush last batch
    next();
  });
}

module.exports = streamFactory;
