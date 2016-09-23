
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
    var names = analyze.street( result.STREET );

    // ensure at least one name was produced
    if( !names.length ){
      return next();
    }

    // compute bbox
    var bbox = batch.reduce( function( memo, res ){
      var lat = parseFloat( res.LAT );
      var lon = parseFloat( res.LON );
      if( lat > memo.lat.max ){ memo.lat.max = lat; }
      if( lat < memo.lat.min ){ memo.lat.min = lat; }
      if( lon > memo.lon.max ){ memo.lon.max = lon; }
      if( lon < memo.lon.min ){ memo.lon.min = lon; }
      return memo;
    }, {
      lat: { min: +Infinity, max: -Infinity },
      lon: { min: +Infinity, max: -Infinity }
    });

    // call db.all(), appending the callback function
    query.lookup(db, names, bbox, function( err, rows ){

      // error debug
      if( err ){
        console.error( err );
        return next();
      }

      // no results found
      if( !rows || !rows.length ){
        return next();
      }

      /**
      [ { id: 9155, line: 't}e`rA}cdehIcI_dCuJsnC[iIWiJ{Ko|DgMkdEuLcyC' }, ... ]
      **/

      // push downstream
      this.push({
        batch: batch,
        streets: rows
      });

      next();
    }.bind(this));

  }, function flush(next){
    query.lookup.finalize();
    next();
  });
}

module.exports = streamFactory;
