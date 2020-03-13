
var child = require('child_process');
var sqlite3 = {};

/**
  convenience functions in order to use the sqlite3 cli to perform assertions.

  note: requires sqlite3 binary installed on system
  ubuntu: sudo apt-get install sqlite3;
**/

sqlite3.exec = function( dbpath, sql ){
  sql = sql.replace(/\"/g, '\\"');
  var cmd = [ 'sqlite3', dbpath, '"', sql, ';"' ], res = '';
  try { res = child.execSync( cmd.join(' '), { encoding: 'utf8' } ); }
  catch( e ){ console.error( e.message ); }
  return res.trim().split('\n');
};

sqlite3.count = function( dbpath, table, conditions ){
  var sql = [ 'SELECT COUNT(*) FROM', table, conditions ].join(' ');
  var lines = sqlite3.exec( dbpath, sql );
  return parseInt( lines[0], 10 );
};

module.exports = sqlite3;
