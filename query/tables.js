module.exports.street = ( db, rebuild ) => {
  // create rtree table
  if( rebuild ){ db.exec(`DROP TABLE IF EXISTS rtree`); }
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS rtree
    USING rtree(
      id, minX, maxX, minY, maxY
    )`
  );

  // create names table
  if( rebuild ){ db.exec(`DROP TABLE IF EXISTS names`); }
  db.exec(`
    CREATE TABLE IF NOT EXISTS names (
      rowid INTEGER PRIMARY KEY, id INTEGER, name TEXT
    )`
  );

  // create polyline table
  if( rebuild ){ db.exec(`DROP TABLE IF EXISTS polyline`); }
  db.exec(`
    CREATE TABLE IF NOT EXISTS polyline (
      id INTEGER PRIMARY KEY, line TEXT
    )`
  );
};

module.exports.address = ( db, rebuild ) => {
  // create address table
  if( rebuild ){ db.exec(`DROP TABLE IF EXISTS address`); }
  db.exec(`
    CREATE TABLE IF NOT EXISTS address (
      rowid INTEGER PRIMARY KEY, id INTEGER, source TEXT, source_id TEXT, housenumber REAL,
      lat REAL, lon REAL, parity TEXT, proj_lat REAL, proj_lon REAL,
      UNIQUE( id, housenumber ) ON CONFLICT IGNORE
    )`
  );
};
