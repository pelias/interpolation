// maximum names to match on
const MAX_NAMES = 10;

// maximum points to match on
const MAX_POINTS = 4;

// maximum street segments to return
const MAX_MATCHES = 5;

const SQL = `
  SELECT street.polyline.id, street.polyline.line FROM street.polyline
  JOIN street.rtree ON street.rtree.id = street.polyline.id
  JOIN street.names ON street.names.id = street.rtree.id
  WHERE ( %%POINT_CONDITIONS%% )
  AND ( %%NAME_CONDITIONS%% )
  LIMIT ${MAX_MATCHES}
`;

const POINT_SQL = '(street.rtree.minX<$lon AND street.rtree.maxX>$lon AND street.rtree.minY<$lat AND street.rtree.maxY>$lat)';
const NAME_SQL = '(street.names.name=$name)';

// sqlite3 prepared statements
var stmt = {};

module.exports = function( db, names, points ){

  // error checking
  if( !names || !names.length || !points || !points.length ){
    return [];
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

    // add point confitions to query
    var pointConditions = Array.apply(null, new Array(max.points)).map(function(__, i){
      return POINT_SQL.replace(/\$lon/g, `$point${i}x`)
                      .replace(/\$lat/g, `$point${i}y`);
    });

    // add name conditions to query
    var nameConditions = Array.apply(null, new Array(max.names)).map(function(__, i){
      return NAME_SQL.replace('$name', `$name${i}`);
    });

    // build unique sql statement
    var sql = SQL.replace( '%%NAME_CONDITIONS%%', nameConditions.join(' OR ') )
                 .replace( '%%POINT_CONDITIONS%%', pointConditions.join(' OR ') );

    // create new prepared statement
    stmt[hash] = db.prepare( sql );
 }

  // create a variable array of args to bind to query
  var args = {};

  // add points
  points.slice(0, max.points).forEach( function( point, i ){
    args[`point${i}x`] = point.lon;
    args[`point${i}y`] = point.lat;
  });

  // add names and callback
  names.slice(0, max.names).forEach(( name, i ) => {
    args[`name${i}`] = name;
  });

  // execute statement
  return stmt[hash].all(args);
};
