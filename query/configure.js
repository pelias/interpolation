
// @see: http://sqlite.org/pragma.html

module.exports = function( db, done ){
  db.serialize(function(){

    // init spatialite extension
    // db.run("SELECT InitSpatialMetaData(1);"); // required for mod_spatialite

    db.run('PRAGMA main.page_size=4096;');
    db.run('PRAGMA main.cache_size=10000;');
    // db.run('PRAGMA main.page_size=1024;'); // (default: 1024)
    // db.run('PRAGMA main.cache_size=-2000;'); // (default: -2000, 2GB)
    // db.run('PRAGMA main.locking_mode=EXCLUSIVE;');
    // db.run('PRAGMA main.synchronous=NORMAL;');
    db.run('PRAGMA main.journal_mode=OFF;');
    db.run('PRAGMA main.temp_store=MEMORY;');
    db.run('VACUUM');

    db.wait(done);
  });
};
