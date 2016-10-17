
var SQL = [
  'SELECT * FROM polyline',
  'JOIN names ON polyline.id = names.id',
  'WHERE polyline.id IN ( %%IDS%% )',
  'LIMIT 10;'
].join(' ');

module.exports = function( db, ids, cb ){

  // execute statement
  db.all( SQL.replace( '%%IDS%%', ids.join(',') ), cb );
};
