
var through = require("through2");

function streamFactory(db, done){

  // vanity statistics
  // var total_saved = 0;

  // sqlite3 prepared statements
  var stmt = {
    rtree: db.prepare("INSERT INTO street_rtree (id, minX, maxX, minY, maxY) VALUES ($id, $minX, $maxX, $minY, $maxY);"),
    names: db.prepare("INSERT INTO street_names (rowid, id, name) VALUES (NULL, $id, $name);"),
    line: db.prepare("INSERT INTO street_polyline (id, line) VALUES ($id, $line);")
  };

  var stats = { total: 0, prev: 0 };
  var ticker = setInterval( function(){
    console.error( stats.total + '\t' + (stats.total - stats.prev) + '/sec' );
    stats.prev = stats.total;
  }, 1000);

  // create a new stream
  return through.obj(function( batch, _, next ){

    // vanity statistics
    // stats.total += batch.length;
    // total_saved += batch.length;
    // console.error( total_saved );

    // run serially so we can use transactions
    db.serialize(function() {

      // start transaction
      db.run("BEGIN TRANSACTION", function(err){
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
          stmt.rtree.run({
            $id:   parsed.id,
            $minX: parsed.minX,
            $maxX: parsed.maxX,
            $minY: parsed.minY,
            $maxY: parsed.maxY
          }, onError("line"));

          // insert line in to polyline table
          stmt.line.run({
            $id:   parsed.id,
            $line: parsed.line
          }, onError("line"));

        }); // foreach
      }); // BEGIN

      // commit transaction
      db.run("END TRANSACTION", function(err){
        onError("COMMIT")(err);

        stats.total += batch.length;
        next();
        // wait for transaction to complete before continuing
      }); // COMMIT
    });// serialize


  }, function( next ){

    clearInterval( ticker );

    db.serialize(function(){

      // finalize prepared statements
      stmt.rtree.finalize( onError("finalize rtree") );
      stmt.names.finalize( onError("finalize names") );
      stmt.line.finalize( onError("finalize line") );

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
