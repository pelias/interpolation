
var through = require('through2');

function streamFactory(db, done){

  // vanity statistics
  var total_saved = 0;

  var stmt = {
    names: db.prepare("INSERT INTO street_names (rowid, id, name) VALUES (NULL, $id, $name);"),
    line: db.prepare("INSERT INTO street_polyline (id, line, minX, maxX, minY, maxY) VALUES ($id, $line, $minX, $maxX, $minY, $maxY);")
  };

  return through.obj({ highWaterMark: 8 }, function( batch, _, next ){

    total_saved += batch.length;
    console.error( total_saved );

    // run serially so we can use transactions
    db.serialize(function() {

      // start transaction
      db.run("BEGIN", function(){

        // import batch
        batch.forEach( function( parsed ){

          // insert names in to lookup table
          parsed.names.forEach( function( name ){
            stmt.names.run({
              $id:   parsed.id,
              $name: name
            }, onError('names'));
          });

          // insert line in to polyline table
          stmt.line.run({
            $id:   parsed.id,
            $line: parsed.line,
            $minX: parsed.minX,
            $maxX: parsed.maxX,
            $minY: parsed.minY,
            $maxY: parsed.maxY
          }, onError('line'));
        });
      });

      // commit transaction
      db.run("COMMIT", function(err){
        onError('COMMIT')(err);

        // wait for transaction to complete before continuing
        next();
      });
    });

  }, function(){

    // finalize prepared statements
    stmt.names.finalize();
    stmt.line.finalize();

    // insert in to rtree
    db.run("INSERT INTO street_rtree (id, minX, maxX, minY, maxY) SELECT id, minX, maxX, minY, maxY FROM street_polyline;", function(){

      // we are done
      done();
    });

  });
}

function onError( title ){
  return function( err ){
    if( err ){
      console.error( "stmt " + title + ": " + err );
    }
  };
}

module.exports = streamFactory;
