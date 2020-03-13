
var through = require('through2'),
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

    // start transaction
    db.transaction(() => {

      // import batch
      batch.forEach( function( address ){

        // insert points in address table
        stmt.address.run(address);
      });
    })();

    // update statistics
    stats.inc( batch.length );

    // wait for transaction to complete before continuing
    next();

  }, function( next ){

    // stop stats ticker
    stats.tick( false );

    done();
    next();
  });
}

module.exports = streamFactory;
