
var through = require('through2'),
    assert = require('../../lib/assert'),
    Statistics = require('../../lib/statistics');

function streamFactory(db, done){

  // sqlite3 prepared statements
  var stmt = {
    rtree: db.prepare('INSERT INTO rtree (id, minX, maxX, minY, maxY) VALUES ($id, $minX, $maxX, $minY, $maxY);'),
    names: db.prepare('INSERT INTO names (rowid, id, name) VALUES (NULL, $id, $name);'),
    line: db.prepare('INSERT INTO polyline (id, line) VALUES ($id, $line);')
  };

  // tick import stats
  var stats = new Statistics();
  stats.tick();

  // create a new stream
  return through.obj(function( batch, _, next ){

    // run serially so we can use transactions
    db.serialize(function() {

      // start transaction
      db.run('BEGIN TRANSACTION', function(err){

        // error checking
        assert.transaction.start(err);

        // import batch
        batch.forEach( function( street ){

          // insert names in to lookup table
          street.getNames().forEach( function( name ){
            stmt.names.run({
              $id:   street.getId(),
              $name: name
            }, assert.statement.names);
          });

          // insert bbox in to rtree table
          var bbox = street.getBbox();
          stmt.rtree.run({
            $id:   street.getId(),
            $minX: bbox.minX,
            $maxX: bbox.maxX,
            $minY: bbox.minY,
            $maxY: bbox.maxY
          }, assert.statement.rtree);

          // insert line in to polyline table
          stmt.line.run({
            $id:   street.getId(),
            $line: street.getEncodedPolyline()
          }, assert.statement.line);

        });
      });

      // commit transaction
      db.run('END TRANSACTION', function(err){

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
      stmt.rtree.finalize( assert.log('finalize rtree') );
      stmt.names.finalize( assert.log('finalize names') );
      stmt.line.finalize( assert.log('finalize line') );

      // we are done
      db.wait(done);
      next();
    });
  });
}

module.exports = streamFactory;
