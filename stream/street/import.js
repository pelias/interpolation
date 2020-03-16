const through = require('through2');
const Statistics = require('../../lib/statistics');

function streamFactory(db, done) {

  // sqlite3 prepared statements
  const stmt = {
    rtree: db.prepare(`INSERT INTO rtree (id, minX, maxX, minY, maxY) VALUES ($id, $minX, $maxX, $minY, $maxY)`),
    names: db.prepare(`INSERT INTO names (rowid, id, name) VALUES (NULL, $id, $name)`),
    line: db.prepare(`INSERT INTO polyline (id, line) VALUES ($id, $line)`)
  };

  // tick import stats
  const stats = new Statistics();
  stats.tick();

  // the insert function imports data from each batch
  // into the database.
  const insert = (batch) => {
    batch.forEach((street) => {

      // insert names in to lookup table
      street.getNames().forEach((name) => {
        stmt.names.run({
          id: street.getId(),
          name: name
        });
      });

      // insert bbox in to rtree table
      const bbox = street.getBbox();
      stmt.rtree.run({
        id: street.getId(),
        minX: bbox.minX,
        maxX: bbox.maxX,
        minY: bbox.minY,
        maxY: bbox.maxY
      });

      // insert line in to polyline table
      stmt.line.run({
        id: street.getId(),
        line: street.getEncodedPolyline()
      });
    });
  };

  // the transform function is executed once per batch in the stream.
  const transform = (batch, encoding, next) => {

    // execute transaction
    db.transaction(insert).deferred(batch);

    // update statistics
    stats.inc(batch.length);

    // ready for more data
    next();
  };

  // the flush function is executed once at the end of the stream.
  const flush = (next) => {

    // stop stats ticker
    stats.tick(false);

    // call streamFactory callback to indicate the stream is complete.
    done();

    // indicate the stream has ended and all work has been complete.
    next();
  };

  // create a new stream
  return through.obj(transform, flush);
}

module.exports = streamFactory;
