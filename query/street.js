
var SQL = [
  'SELECT * FROM polyline',
  'JOIN names ON polyline.id = names.id',
  'WHERE polyline.id = ?',
  'LIMIT 1;'
].join(' ');

module.exports = function( db, id, cb ){

  // execute statement
  db.get( SQL, [ id ], cb );
};
