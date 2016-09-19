
module.exports = function( db, rebuild, done ){
  db.serialize(function(){

    // create street_rtree table
    if( rebuild ){ db.run("DROP TABLE IF EXISTS street_rtree;"); }
    db.run("CREATE VIRTUAL TABLE IF NOT EXISTS street_rtree USING rtree(id, minX, maxX, minY, maxY);");

    // create street_names table
    if( rebuild ){ db.run("DROP TABLE IF EXISTS street_names;"); }
    db.run("CREATE TABLE IF NOT EXISTS street_names (rowid INTEGER PRIMARY KEY, id INTEGER, name TEXT);");

    // create street_fts table
    // if( rebuild ){ db.run("DROP TABLE IF EXISTS street_fts;"); }
    // db.run("CREATE VIRTUAL TABLE IF NOT EXISTS street_fts USING fts4(rowid INTEGER PRIMARY KEY, id INTEGER, name TEXT, notindexed=id, tokenize=simple);");

    // create street_polyline table
    if( rebuild ){ db.run("DROP TABLE IF EXISTS street_polyline;"); }
    db.run("CREATE TABLE IF NOT EXISTS street_polyline (id INTEGER PRIMARY KEY, line TEXT, minX REAL, maxX REAL, minY REAL, maxY REAL);");

    // create street_geometry table
    // if( rebuild ){ db.run("DROP TABLE IF EXISTS street_geometry;"); }
    // db.run("CREATE TABLE IF NOT EXISTS street_geometry (id INTEGER PRIMARY KEY);");
    // if( rebuild ){ db.run("SELECT AddGeometryColumn('street_geometry', 'geometry', 4326, 'LINESTRING', 'xy', 1);"); }

    // create street_address table
    if( rebuild ){ db.run("DROP TABLE IF EXISTS street_address;"); }
    db.run("CREATE TABLE IF NOT EXISTS street_address (rowid INTEGER PRIMARY KEY, id INTEGER, source TEXT, housenumber REAL, lat REAL, lon REAL, proj_lat REAL, proj_lon REAL);");

    db.wait(done);
  });
};
