
/**
  find all streets which have a bbox which envelops the specified point; regardless of their names.
**/

// maximum street segments to return
var MAX_MATCHES = 100;

var SQL = [
  'SELECT street.polyline.id, street.polyline.line, street.names.name FROM street.polyline',
  'JOIN street.rtree ON street.rtree.id = street.polyline.id',
  'JOIN street.names ON street.names.id = street.polyline.id',
  'WHERE (street.rtree.minX<$LON AND street.rtree.maxX>$LON AND street.rtree.minY<$LAT AND street.rtree.maxY>$LAT)',
  'GROUP BY street.polyline.id',
  'LIMIT $LIMIT;'
].join(' ');

// sqlite3 prepared statements
var stmt;

module.exports = function( db, point, cb ){

  // create prepared statement if one doesn't exist
  if( !stmt ){ stmt = db.prepare( SQL ); }

  // execute statement
  stmt.all({
    $LON: point.lon,
    $LAT: point.lat,
    $LIMIT: MAX_MATCHES
  }, cb);
};

module.exports.finalize = function(){
  if( stmt ){
    stmt.finalize();
  }
};
