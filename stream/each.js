const from = require('from2');

/**
  query for each row in a table; one by one (with stream backpressure).
**/
function streamFactory(db, sql) {
  const stmt = db.prepare(sql);
  const iterator = stmt.iterate();

  return from.obj((size, next) => {
    var ok = true;
    while (ok) {
      const elt = iterator.next();
      if (!elt.done) {
        ok = next(null, elt.value);
      } else {
        next(null, null);
        break;
      }
    }
  });
}

module.exports = streamFactory;
