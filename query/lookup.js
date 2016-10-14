
// maximum names to match on
var MAX_NAMES = 10;

// maximum points to match on
var MAX_POINTS = 4;

// maximum street segments to return
var MAX_MATCHES = 5;

var SQL = [
  'SELECT street.polyline.id, street.polyline.line FROM street.polyline',
  'JOIN street.rtree ON street.rtree.id = street.polyline.id',
  'JOIN street.names ON street.names.id = street.rtree.id',
  'WHERE ( %%POINT_CONDITIONS%% )',
  'AND ( %%NAME_CONDITIONS%% )',
  'LIMIT %%MAX_MATCHES%%;'
].join(' ');

var POINT_SQL = '(street.rtree.minX<?A AND street.rtree.maxX>?B AND street.rtree.minY<?C AND street.rtree.maxY>?D)';
var NAME_SQL = '(street.names.name=?)';

// sqlite3 prepared statements
var stmt = {};

module.exports = function( db, names, points, cb ){

  // error checking
  if( !names || !names.length || !points || !points.length ){
    return cb( null, [] );
  }

  // max conditions to search on
  var max = {
    names: Math.min( names.length, MAX_NAMES ),
    points: Math.min( points.length, MAX_POINTS )
  };

  // give this statement a unique key
  var hash = '' + max.names + '|' + max.points;

  // create prepared statement if one doesn't exist
  if( !stmt.hasOwnProperty( hash ) ){

    // use named parameters to avoid sending coordinates twice for rtree conditions
    var position = 1;

    // add point confitions to query
    var pointConditions = Array.apply(null, new Array(max.points)).map(function(){
      return POINT_SQL.replace('?A', '?' + position)
                      .replace('?B', '?' + position++)
                      .replace('?C', '?' + position)
                      .replace('?D', '?' + position++);
    });

    // add name conditions to query
    var nameConditions = Array.apply(null, new Array(max.names)).map( function(){
      return NAME_SQL.replace('?', '?' + position++);
    });

    // build unique sql statement
    var sql = SQL.replace( '%%NAME_CONDITIONS%%', nameConditions.join(' OR ') )
                 .replace( '%%POINT_CONDITIONS%%', pointConditions.join(' OR ') )
                 .replace( '%%MAX_MATCHES%%', MAX_MATCHES );

    // create new prepared statement
    stmt[hash] = db.prepare( sql );
 }

  // create a variable array of args to bind to query
  var args = [];

  // add points
  points.slice(0, max.points).forEach( function( point ){
    args.push( point.lon, point.lat );
  });

  // add names and callback
  args = args.concat( names.slice(0, max.names), cb );

  // execute statement
  stmt[hash].all.apply(stmt[hash], args);
};

module.exports.finalize = function(){
  for( var hash in stmt ){
    stmt[hash].finalize();
  }
};
