
// maximum names to match on
var MAX_NAMES = 10;

// maximum street segments to return
var MAX_MATCHES = 5;

var SQL = [
  "SELECT DISTINCT street.polyline.id, street.polyline.line FROM street.polyline",
  "JOIN street.rtree ON street.rtree.id = street.polyline.id",
  "JOIN street.names ON street.names.id = street.rtree.id",
  "WHERE ( street.rtree.minX>? AND street.rtree.maxX<? AND street.rtree.minY>? AND street.rtree.maxY<? )",
  "AND ( %%NAME_CONDITIONS%% )",
  "LIMIT " + MAX_MATCHES + ";"
].join(" ");

var NAME_SQL = '( street.names.name = ? )';

// increase/decrease bbox bounds by this much
var FUDGE_FACTOR = 0.005;

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
  var args = [
    bbox.lon.min - FUDGE_FACTOR,
    bbox.lon.max + FUDGE_FACTOR,
    bbox.lat.min - FUDGE_FACTOR,
    bbox.lat.max + FUDGE_FACTOR
  ].concat(names.slice(0, max.names), cb);

  stmt[max.names].all.apply(stmt[max.names], args);
};

module.exports.finalize = function(){
  stmt.forEach( function( s ){
    s.finalize();
  });
};
