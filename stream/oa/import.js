
var through = require("through2");

function streamFactory(db, done){

  // vanity statistics
  var total_saved = 0;

  // sqlite3 prepared stmt
  var stmt = {
    address: db.prepare("INSERT INTO street_address (rowid, id, source, housenumber, lat, lon, proj_lat, proj_lon) VALUES (NULL, $id, $source, $housenumber, $lat, $lon, $proj_lat, $proj_lon);")
  };

  // create a new stream
  return through.obj({ highWaterMark: 8 }, function( batch, _, next ){

    // vanity statistics
    total_saved += batch.length;
    // console.error( total_saved );

    // run serially so we can use transactions
    db.serialize(function() {

      // start transaction
      db.run("BEGIN", function(err){
        onError("BEGIN")(err);

        // import batch
        batch.forEach( function( address ){

          // insert point values in db
          stmt.address.run (address, function(err){
            onError("address")(err);
            process.stderr.write('.');
          });
        });
      });

      // commit transaction
      db.run("COMMIT", function(err){
        onError("COMMIT")(err);

        // wait for transaction to complete before continuing
        next();
      });
    });

  }, function flush( next ){

    // finalize prepared stmt
    stmt.address.finalize( onError("finalize address") );

    // we are done
    db.wait(done);
    next();

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
