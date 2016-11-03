
var through = require('through2');

/**
  query for each row in a table; one by one (with stream backpressure).
**/
function streamFactory( db, table ){

  // create prepared statement
  var stmt = db.prepare( 'SELECT * FROM ' + table + ' WHERE id = ?' );
  var readOne;

  // create a passthrough stream which also requests a new record from the
  // database after it passed the previous one downstream.
  var stream = through.obj( function( row, _, next ){
    this.push( row );
    readOne();
    next();
  }, function flush( next ){
    stmt.finalize(); // finalize prepared statement
    next();
  });

  db.serialize( function(){

    var cur = 1; // current row number
    var max = 0; // maximum rowid in table

    // read the next row from the table
    readOne = function(){

      // reached last record in table
      if( cur > max ){ return stream.end(); }

      // get record by id
      stmt.get([ cur++ ], function( err, row ){

        // an error occurred
        if( err ){ console.error( err ); }

        // id not found in table (possibly a deleted record?); continue to the next id
        if( !row ){ return readOne(); }

        // write row on to stream
        stream.write( row );
      });
    };

    // calculate the highest rowid in the table
    db.get( 'SELECT MAX( rowid ) as max FROM ' + table, function( err, row ){

      // an error occurred
      if( err ){ return console.error( err ); }
      if( !row || !row.max ){ return console.error( 'no rows in table', table ); }

      // maximum rowid in table
      max = parseInt( row.max, 10 );

      // kick off iteration
      readOne();
    });

  });

  return stream;
}

module.exports = streamFactory;
