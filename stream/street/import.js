
const through = require('through2');
const Statistics = require('../../lib/statistics');

function streamFactory(db, done) {

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
  return through.obj(function (batch, _, next) {

    // start transactio
    db.transaction(() => {

      // import batch
      batch.forEach(function (street) {

        // insert names in to lookup table
        street.getNames().forEach(function (name) {
          stmt.names.run({
            id: street.getId(),
            name: name
          });
        });

        // insert bbox in to rtree table
        var bbox = street.getBbox();
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
    }).deferred();

    // update statistics
    stats.inc(batch.length);

    // wait for transaction to complete before continuing
    next();

  }, function (next) {

    // stop stats ticker
    stats.tick(false);

    done();
    next();
  });
}

module.exports = streamFactory;
