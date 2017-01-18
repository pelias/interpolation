
var through = require('through2'),
    assert = require('../../lib/assert'),
    Statistics = require('../../lib/statistics');

function streamFactory(db, done){

  // sqlite3 prepared stmt
  var stmt = {
    address: db.prepare([
      'INSERT INTO address (rowid, id, source, source_id, housenumber, lat, lon, parity, proj_lat, proj_lon)',
      'VALUES (NULL, $id, $source, $source_id, $housenumber, $lat, $lon, $parity, $proj_lat, $proj_lon);'
    ].join(' '))
  };

  // tick import stats
  var stats = new Statistics();
  stats.tick();

  // create a new stream
  return through.obj({ highWaterMark: 2 }, function( batch, _, next ){

    // run serially so we can use transactions
    db.serialize(function() {

      // start transaction
      db.run('BEGIN TRANSACTION', function(err){

        // error checking
        assert.transaction.start(err);

        // import batch
        batch.forEach( function( address ){

          // insert points in address table
          stmt.address.run(address, assert.statement.address);
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
      stmt.address.finalize( assert.log('finalize address') );

      // we are done
      db.wait(done);
      next();
    });
  });
}

module.exports = streamFactory;
