var fs = require('fs'),
    util = require('util'),
    through = require('through2'),
    query = { lookup: require('../../query/lookup') },
    project = require('../../lib/project'),
    analyze = require('../../lib/analyze');

// open file descriptor 3 for logging conflation errors (when available)
// note: to enable logging you need to attach the fd with a command such as:
// $ node oa.js 3> conflate.skip
var hasFD3 = false;
try { hasFD3 = fs.statSync('/dev/fd/3').isFile(); } catch(e){}
if( hasFD3 ){
  process.conferr = fs.createWriteStream( null, { fd: 3 } );
  process.conferr.on( 'error', function(){ process.conferr = { write: function noop(){} }; });
}

const analyze_street = util.promisify(analyze.street);

function streamFactory(db){

  return through.obj(async function( batch, _, next ){

    // invalid batch
    if( !batch || !batch.length ){
      return next();
    }

    // we could potentially use any batch member?
    // so just choose the first since it doesn't matter.
    var result = batch[0];

    // all street names in batch should be the same
    // perform libpostal normalization

    var names = await analyze_street( result.getStreet() );

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

        // log addresss which do not conflate to file descriptor 3 (when available)
        if( hasFD3 ){
          batch.forEach( function( address ){
            process.conferr.write( JSON.stringify( address ) + '\n' );
          });
        }
        return next();
      }

      // dedupe array
      // @todo: try to do this in SQL using DISTICT?
      // tried doing this before and performance was terrible.
      var seen = [];
      rows = rows.filter( function( row ){
        if( seen[ row.id ] ){ return false; }
        seen[ row.id ] = true;
        return true;
      });

      // // remove short road segments (prefer larger roads)
      var longLinesOnly = rows.filter( function( row ){
        return row.line.length > 12;
      });

      /**
      [ { id: 9155, line: 't}e`rA}cdehIcI_dCuJsnC[iIWiJ{Ko|DgMkdEuLcyC' }, ... ]
      **/

      // push downstream
      this.push({
        batch: batch,
        streets: ( longLinesOnly.length > 1 ) ? longLinesOnly : rows
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
  var sorted = project.sort( batch.map( function( address ){
    return address.getCoord();
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
