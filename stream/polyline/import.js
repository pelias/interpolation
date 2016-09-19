
var through = require("through2");

function streamFactory(db, done){

  // vanity statistics
  var total_saved = 0;

  // sqlite3 prepared statements
  var stmt = {
    names: db.prepare("INSERT INTO street_names (rowid, id, name) VALUES (NULL, $id, $name);"),
    line: db.prepare("INSERT INTO street_polyline (id, line, minX, maxX, minY, maxY) VALUES ($id, $line, $minX, $maxX, $minY, $maxY);")
  };

  // create a new stream
  return through.obj({ highWaterMark: 8 }, function( batch, _, next ){

    // vanity statistics
    total_saved += batch.length;
    console.error( total_saved );

    // run serially so we can use transactions
    db.serialize(function() {

      // start transaction
      db.run("BEGIN", function(err){
        onError("BEGIN")(err);

        // import batch
        batch.forEach( function( parsed ){

          // insert names in to lookup table
          parsed.names.forEach( function( name ){
            stmt.names.run({
              $id:   parsed.id,
              $name: name
            }, onError("names"));
          });

          // insert line in to polyline table
          stmt.line.run({
            $id:   parsed.id,
            $line: parsed.line,
            $minX: parsed.minX,
            $maxX: parsed.maxX,
            $minY: parsed.minY,
            $maxY: parsed.maxY
          }, onError("line"));

        }); // foreach
      }); // BEGIN

      // commit transaction
      db.run("COMMIT", function(err){
        onError("COMMIT")(err);

        // wait for transaction to complete before continuing
        next();
      }); // COMMIT
    });// serialize

  }, function( next ){
    db.serialize(function(){

      // finalize prepared statements
      stmt.names.finalize( onError("finalize names") );
      stmt.line.finalize( onError("finalize line") );

      // copy bbox data from 'street_polyline' to 'street_rtree' in a single statement.
      // this uses more disk (as the floats are stored twice) but presumably yeild better performance
      // than building the rtree incrementally; because rtrees need to be rebalanced as they are built.
      // note: after this operation it should be safe to drop those columns from 'street_polyline'.
      // see: https://www.sqlite.org/faq.html#q11
      db.run("INSERT INTO street_rtree (id, minX, maxX, minY, maxY) SELECT id, minX, maxX, minY, maxY FROM street_polyline;");

      // we are done
      db.wait(done);
      next();
    });
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
