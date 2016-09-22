
// maximum names to match on
var MAX_CONDITIONS = 20;

var sql = [
  "SELECT DISTINCT street.polyline.id, street.polyline.line FROM street.polyline",
  "JOIN street.rtree ON street.rtree.id = street.polyline.id",
  "JOIN street.names ON street.names.id = street.rtree.id",
  "WHERE ( street.rtree.minX<=? AND street.rtree.maxX>=? AND street.rtree.minY<=? AND street.rtree.maxY>=? )",
  "AND ( %%AND_CONDITIONS%% )",
  "ORDER BY ( ", // distance from the center of the street
  "ABS(? - (street.rtree.minX + ( street.rtree.maxX - street.rtree.minX )/2 )) + ",
  "ABS(? - (street.rtree.minY + ( street.rtree.maxY - street.rtree.minY )/2 ))",
  " ) ASC",
  "LIMIT 1"
].join(" ");

// sqlite3 prepared statements
var stmt = [];

module.exports = function( db, names, focus, cb ){

  // error checking
  if( !names || !names.length || !focus || !focus.hasOwnProperty('lat') || !focus.hasOwnProperty('lon') ){
    return cb( null, [] );
  }

  // max conditions to search on
  var max = Math.min( names.length, MAX_CONDITIONS );

  // lazy create prepared statements
  if( !stmt[max] ){
    var conditions = Array.apply(null, Array(max)).map(function(){ return 'street.names.name = ?'; });
    stmt[max] = db.prepare( sql.replace( '%%AND_CONDITIONS%%', conditions.join(" OR ") ) );
  }

  var timer = (new Date()).getTime();

  // create a variable array of args to bind to query
  var args = [ focus.lon, focus.lon, focus.lat, focus.lat ].concat( names.slice(0, max), focus.lon, focus.lat, cb);

  stmt[max].get.apply(stmt[max], args);
};

module.exports.finalize = function(){
  stmt.forEach( function( s ){
    s.finalize();
  });
};
