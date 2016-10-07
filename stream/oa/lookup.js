
var through = require("through2"),
    assert = require('../../lib/assert'),
    Statistics = require('../../lib/statistics'),
    query = { lookup: require('../../query/lookup') },
    project = require('../../lib/project'),
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

    // select points to search on
    var points = selectPoints( batch );

    // console.error( points );

    // call db.all(), appending the callback function
    query.lookup(db, names, points, function( err, rows ){

      // error debug
      if( err ){
        console.error( err );
        return next();
      }

      // no results found
      if( !rows || !rows.length ){
        // log items which do not conflate to stdout
        batch.forEach( function( row ){
          console.log( JSON.stringify( row ) );
        });
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

/**
  select the minimum number of coordinates to search on.
  should cover enough space to include one entry for each bbox we want to
  return.
**/
function selectPoints( batch ){

  // sort points in the batch
  var sorted = project.sort( batch.map( function( res ){
    return {
      lat: parseFloat( res.LAT ),
      lon: parseFloat( res.LON )
    };
  }));

  // return between 0-2 points (whatever we have)
  if( sorted.length < 3 ){
    return sorted;
  }

  // last key of array
  var last = sorted.length-1;

  // return two extremes
  if( sorted.length < 5 ){
    return [ sorted[0], sorted[last] ];
  }

  // half key of array
  var mid = Math.floor( sorted.length / 2 );

  // return two extremes and the midpoint
  if( sorted.lenth < 7 ){
    return [ sorted[0], sorted[mid], sorted[last] ];
  }

  // quarter key of array
  var quarter = Math.floor( sorted.length / 3 );

  // return two extremes and the 1 quarter and 3 quarter points
  return [ sorted[0], sorted[quarter], sorted[quarter*2], sorted[last] ];
}

module.exports = streamFactory;
