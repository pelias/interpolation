
// @see: http://sqlite.org/pragma.html

module.exports = function( db ){
  db.run('PRAGMA main.foreign_keys=OFF;'); // we don't enforce foreign key constraints
  db.run('PRAGMA main.page_size=4096;'); // (default: 1024)
  db.run('PRAGMA main.cache_size=-2000;'); // (default: -2000, 2GB)
  db.run('PRAGMA main.synchronous=OFF;');
  db.run('PRAGMA main.journal_mode=OFF;');
  db.run('PRAGMA main.temp_store=MEMORY;');
};
