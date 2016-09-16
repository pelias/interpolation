
// @see: http://sqlite.org/pragma.html

module.exports = function( db ){

  // // init spatialite extension
  // // db.run("SELECT InitSpatialMetaData(1);"); // required for mod_spatialite
  //
  // // configure db for performance
  // // @see: http://stackoverflow.com/questions/1711631/improve-insert-per-second-performance-of-sqlite
  // // db.run("PRAGMA synchronous=OFF;");
  // db.run("PRAGMA journal_mode=OFF;");
  // // db.run("PRAGMA journal_mode=MEMORY;");
  // // db.run("PRAGMA journal_mode=WAL;");
  // // db.run("PRAGMA wal_autocheckpoint=1;");
  //
  // // db.run("PRAGMA synchronous=OFF;");
  // // db.run("PRAGMA count_changes=OFF;");
  // // db.run("PRAGMA journal_mode=MEMORY;");
  // // db.run("PRAGMA temp_store=MEMORY;");
  //
  // db.run("PRAGMA synchronous=FULL;");
  // db.run("PRAGMA cache_size=10;");
  // db.run("PRAGMA temp_store=FILE;");
  //
  // // bytes stored per page (default: 1024)
  // db.run("PRAGMA page_size=1024;");
  //
  // // pages stored in memory (default: -2000, 2GB)
  // // db.run("PRAGMA cache_size=-2000;");
  //
  // // required in order to take effect after db has been created
  // db.run('VACUUM');

  db.run('PRAGMA main.page_size=1024;'); // (default: 1024)
  db.run('PRAGMA main.cache_size=-2000;'); // (default: -2000, 2GB)
  db.run('PRAGMA main.locking_mode=EXCLUSIVE;');
  db.run('PRAGMA main.synchronous=NORMAL;');
  db.run('PRAGMA main.journal_mode=OFF;');
  db.run('PRAGMA main.temp_store=MEMORY;');
  db.run('VACUUM');
};
