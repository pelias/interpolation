const through = require('through2');
const Statistics = require('../../lib/statistics');

function streamFactory(db, done){

  // sqlite3 prepared stmt
  const stmt = {
    address: db.prepare(`
      INSERT INTO address (
        rowid, id, source, source_id, housenumber,
        lat, lon, parity, proj_lat, proj_lon
      )
      VALUES (
        NULL, $id, $source, $source_id, $housenumber,
        $lat, $lon, $parity, $proj_lat, $proj_lon
      )
    `)
  };

  // tick import stats
  const stats = new Statistics();
  stats.tick();

  // create a new stream
  const stream = through.obj(function( batch, _, next ){

    // start transaction
    db.transaction(() => {

      // import batch
      batch.forEach( function( address ){

        // insert points in address table
        stmt.address.run(address);
      });
    }).deferred();

    // update statistics
    stats.inc( batch.length );

    // wait for transaction to complete before continuing
    next();

  }, function( next ){

    // stop stats ticker
    stats.tick(false);

    done();
    next();
  });

  // stop stats ticker on stream error
  stream.on('error', () => {
    stats.tick(false);
  });

  return stream;
}

module.exports = streamFactory;
