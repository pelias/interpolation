
var through = require('through2'),
    postal = require('node-postal');

var sql = [
  "SELECT street_polyline.id, street_names.name, street_polyline.line FROM street_polyline",
  "JOIN street_rtree ON street_rtree.id = street_polyline.id",
  "JOIN street_names ON street_names.id = street_rtree.id",
  "WHERE ( street_rtree.minX<=? AND street_rtree.maxX>=? AND street_rtree.minY<=? AND street_rtree.maxY>=? )",
  "AND ( street_names.name = ?"
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
$ sqlite3 example.db "select id, * from street_rtree WHERE ( street_rtree.minX<=174.7668435 AND street_rtree.maxX>=174.7668435 AND street_rtree.minY<=-41.2887878 AND street_rtree.maxY>=-41.2887878 );"
136|136|174.765075683594|174.768371582031|-41.2904777526855|-41.2861595153809
*/

function streamFactory(db){

  // prepared statement
  var statement = {
    address: db.prepare("INSERT INTO street_address (rowid, id, source, housenumber, lat, lon) VALUES (NULL, $id, $source, $housenumber, $lat, $lon);")
  };

  return through.obj(function( batch, _, next ){

    // invalid batch
    if( !batch || !batch.length ){
      return next();
    }

    // all street names in batch should be the same
    var streetName = batch[0].STREET;

    // perform libpostal normalization
    var names = postal.expand.expand_address( streetName );

    // ensure at least one name was produced
    if( !names.length ){
      return next();
    }

    // copy base query and add OR statements for multiple names
    var query = sql.slice();
    for( var x=1; x<names.length; x++ ){
      query.push("OR street_names.name = ?");
    }
    query.push(")"); // close OR group

    // create a variable array of args to bind to query
    var args = [
      query.join(" ") + ";",
      batch[0].LON, batch[0].LON,
      batch[0].LAT, batch[0].LAT
    ].concat(names);

    // call db.all(), appending the callback function
    db.all.apply(db, args.concat(function( err, rows ){

      /**
      [ { id: 9155,
          name: 'elizabeth street',
          line: 't}e`rA}cdehIcI_dCuJsnC[iIWiJ{Ko|DgMkdEuLcyC' } ]
      **/

      // @todo: select best row instead of first (unlikely to find >1 anyway)
      if( rows && rows.length ){
        db.parallelize(function(){
          batch.forEach( function( item ){
            statement.address.run({
              $id: rows[0].id,
              $source: 'OA',
              $housenumber: parseInt( item.NUMBER, 10 ), // @note: removes letters such as '2a' -> 2
              $lat: batch[0].LAT,
              $lon: batch[0].LON,
            }, function(){
              // debug
              process.stderr.write('.');
            });
          });
        });
      }

      next();
    }));

  }, function(){

    // finalize prepared statement
    statement.address.finalize(onError);
  });
}

function onError(label){
  return function(err){
    process.stderr.write(label);
    if( err ){
      console.error( err );
    }
  }
}

module.exports = streamFactory;
