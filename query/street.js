
var SQL = [
  'SELECT * FROM polyline',
  'WHERE id = ?',
  'LIMIT 1;'
].join(' ');

module.exports = function( db, id, cb ){

  // execute statement
  db.get(SQL, [ id ], cb);
};
