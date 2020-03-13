
// maximum names to match on
var MAX_NAMES = 10;

// maximum address records to return
var MAX_MATCHES = 5000; // note: this query should only be used for debugging purposes

var SQL = [
  'SELECT address.* FROM street.rtree',
  'JOIN street.names ON street.names.id = street.rtree.id',
  'JOIN address ON address.id = street.rtree.id',
  'WHERE (',
    'street.rtree.minX<=$lon AND street.rtree.maxX>=$lon AND',
    'street.rtree.minY<=$lat AND street.rtree.maxY>=$lat',
  ')',
  'AND ( %%NAME_CONDITIONS%% )',
  'ORDER BY address.housenumber ASC', // @warning business logic depends on this
  `LIMIT ${MAX_MATCHES};`
].join(' ');

var NAME_SQL = '(street.names.name=?)';

module.exports = function( db, point, names, cb ){

  // error checking
  if( !names || !names.length ){
    return cb( null, [] );
  }

  // max conditions to search on
  var max = { names: Math.min( names.length, MAX_NAMES ) };

  // add name conditions to query
  var nameConditions = Array.apply(null, new Array(max.names)).map( function(__, i){
    return NAME_SQL.replace('?', `$name${i}`);
  });

  // build unique sql statement
  var sql = SQL.replace( '%%NAME_CONDITIONS%%', nameConditions.join(' OR ') );

  var params = {
    $lon: point.lon,
    $lat: point.lat,
  }

  names.slice(0, max.names).forEach((name, i) => {
    args[`$name${i}`] = name;
  })

  // create a variable array of params for the query
  // var params = [ point.lon, point.lat ].concat( names.slice(0, max.names) );

  // execute query
  db.all( sql, params, cb );
};
