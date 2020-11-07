
// @see: http://sqlite.org/pragma.html

module.exports = ( db ) => {
  db.exec('PRAGMA main.foreign_keys=OFF;'); // we don't enforce foreign key constraints
  db.exec('PRAGMA main.page_size=4096;'); // (default: 1024)
  db.exec('PRAGMA main.cache_size=-2000;'); // (default: -2000, 2GB)
  db.exec('PRAGMA main.synchronous=OFF;');
  db.exec('PRAGMA main.journal_mode=MEMORY;'); // better-sqlite3 does not support 'OFF'
  db.exec('PRAGMA main.temp_store=MEMORY;');
};
