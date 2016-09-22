
var through = require("through2"),
    assert = require('../../lib/assert');
    Statistics = require('../../lib/statistics');

function streamFactory(db, done){

  // sqlite3 prepared statements
  var stmt = {
    rtree: db.prepare("INSERT INTO street_rtree (id, minX, maxX, minY, maxY) VALUES ($id, $minX, $maxX, $minY, $maxY);"),
    names: db.prepare("INSERT INTO street_names (rowid, id, name) VALUES (NULL, $id, $name);"),
    line: db.prepare("INSERT INTO street_polyline (id, line) VALUES ($id, $line);")
  };

  // tick import stats
  var stats = new Statistics();
  stats.tick();

  // create a new stream
  return through.obj(function( batch, _, next ){

    // run serially so we can use transactions
    db.serialize(function() {

      // start transaction
      db.run("BEGIN TRANSACTION", function(err){

        // error checking
        assert.transaction.start(err);

        // import batch
        batch.forEach( function( parsed ){

          // insert names in to lookup table
          parsed.names.forEach( function( name ){
            stmt.names.run({
              $id:   parsed.id,
              $name: name
            }, assert.statement.names);
          });

          // insert bbox in to rtree table
          stmt.rtree.run({
            $id:   parsed.id,
            $minX: parsed.minX,
            $maxX: parsed.maxX,
            $minY: parsed.minY,
            $maxY: parsed.maxY
          }, assert.statement.rtree);

          // insert line in to polyline table
          stmt.line.run({
            $id:   parsed.id,
            $line: parsed.line
          }, assert.statement.line);

        });
      });

      // commit transaction
      db.run("END TRANSACTION", function(err){

        // error checking
        assert.transaction.end(err);

        // update statistics
        stats.inc( batch.length );

        // wait for transaction to complete before continuing
        next();

      });
    });

  }, function( next ){

    // stop stats ticker
    stats.tick( false );

    // clean up
    db.serialize(function(){

      // finalize prepared statements
      stmt.rtree.finalize( assert.log("finalize rtree") );
      stmt.names.finalize( assert.log("finalize names") );
      stmt.line.finalize( assert.log("finalize line") );

      // we are done
      db.wait(done);
      next();
    });
  });
}

module.exports = streamFactory;
