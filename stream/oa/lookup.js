
var through = require("through2"),
    assert = require('../../lib/assert'),
    Statistics = require('../../lib/statistics'),
    query = { lookup: require('../../query/lookup') },
    analyze = require('../../lib/analyze');

function streamFactory(db){

  return through.obj(function( batch, _, next ){

    // invalid batch
    if( !batch || !batch.length ){
      return next();
    }

    // we could potentially use any batch member?
    // so just choose the first since it doesn't matter.
    var result = batch[0];

    // all street names in batch should be the same
    // perform libpostal normalization
    var names = analyze( result.STREET );

    // ensure at least one name was produced
    if( !names.length ){
      return next();
    }

    var focus = {
      lat: result.LAT,
      lon: result.LON
    };

    // call db.all(), appending the callback function
    query.lookup(db, names, focus, function( err, row ){

      // error debug
      if( err ){
        console.error( err );
        return next();
      }

      // no results found
      if( !row ){
        return next();
      }

      /**
      [ { id: 9155, line: 't}e`rA}cdehIcI_dCuJsnC[iIWiJ{Ko|DgMkdEuLcyC' }, ... ]
      **/

      // push downstream
      this.push({
        batch: batch,
        street: row
      });

      next();
    }.bind(this));

  }, function flush(next){
    query.lookup.finalize();
    next();
  });
}

module.exports = streamFactory;
