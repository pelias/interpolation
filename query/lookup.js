
// maximum names to match on
var MAX_NAMES = 10;

var SQL = [
  "SELECT DISTINCT street.polyline.id, street.polyline.line FROM street.polyline",
  "JOIN street.rtree ON street.rtree.id = street.polyline.id",
  "JOIN street.names ON street.names.id = street.rtree.id",
  "WHERE ( street.rtree.minX<=? AND street.rtree.maxX>=? AND street.rtree.minY<=? AND street.rtree.maxY>=? )",
  "AND ( %%NAME_CONDITIONS%% );",
].join(" ");

var NAME_SQL = '( street.names.name = ? )';

// sqlite3 prepared statements
var stmt = [];

module.exports = function( db, names, bbox, cb ){

  // error checking
  if( !names || !names.length || !bbox ){
    return cb( null, [] );
  }

  // max conditions to search on
  var max = { names: Math.min( names.length, MAX_NAMES ) };

  // lazy create prepared statements
  if( !stmt[max.names] ){
    var nameConditions = Array.apply(null, Array(max.names)).map(function(){ return NAME_SQL; });
    var sql = SQL.replace( '%%NAME_CONDITIONS%%', nameConditions.join(" OR ") );
    stmt[max.names] = db.prepare( sql );
  }

  // create a variable array of args to bind to query
  var args = [bbox.lon.max, bbox.lon.min, bbox.lat.max, bbox.lat.min].concat(names.slice(0, max.names), cb);

  stmt[max.names].all.apply(stmt[max.names], args);
};

module.exports.finalize = function(){
  stmt.forEach( function( s ){
    s.finalize();
  });
};
