
var through = require('through2'),
    analyze = require('../../lib/analyze');

var sql = [
  "SELECT street.polyline.id, street.names.name, street.polyline.line FROM street.polyline",
  "JOIN street.rtree ON street.rtree.id = street.polyline.id",
  "JOIN street.names ON street.names.id = street.rtree.id",
  "WHERE ( street.rtree.minX<=? AND street.rtree.maxX>=? AND street.rtree.minY<=? AND street.rtree.maxY>=? )",
  "AND ( street.names.name = ?"
];

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

/*
$ sqlite3 example.db "select id, * from street.rtree WHERE ( street.rtree.minX<=174.7668435 AND street.rtree.maxX>=174.7668435 AND street.rtree.minY<=-41.2887878 AND street.rtree.maxY>=-41.2887878 );"
136|136|174.765075683594|174.768371582031|-41.2904777526855|-41.2861595153809
*/

function streamFactory(db){

  return through.obj(function( batch, _, next ){

    // invalid batch
    if( !batch || !batch.length ){
      return next();
    }

    // we could potentially use any batch member?
    // so just choose the first since it doesn't matter.
    var firstBatchResult = batch[0];

    // all street names in batch should be the same
    var streetName = firstBatchResult.STREET;

    // perform libpostal normalization
    var names = analyze( streetName );

    // ensure at least one name was produced
    if( !names.length ){
      return next();
    }

    // copy base query and add OR statements for multiple names
    var query = sql.slice();
    for( var x=1; x<names.length; x++ ){
      query.push("OR street.names.name = ?");
    }
    query.push(")"); // close OR group

    // create a variable array of args to bind to query
    var args = [
      query.join(" ") + ";",
      firstBatchResult.LON, firstBatchResult.LON,
      firstBatchResult.LAT, firstBatchResult.LAT
    ].concat(names);

    // call db.all(), appending the callback function
    db.all.apply(db, args.concat(function( err, rows ){

      // error debug
      if( err ){
        console.error( err );
      }

      /**
      [ { id: 9155,
          name: 'elizabeth street',
          line: 't}e`rA}cdehIcI_dCuJsnC[iIWiJ{Ko|DgMkdEuLcyC' } ]
      **/

      if( rows && rows.length ){

        // push downstream
        this.push({
          batch: batch,
          matched: rows
        });
      }

      next();
    }.bind(this)));

  });
}

// generic error handler
function onError( title ){
  return function( err ){
    if( err ){
      console.error( "stmt " + title + ": " + err );
    }
  };
}

module.exports = streamFactory;
