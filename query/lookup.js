const DynamicQueryCache = require('./DynamicQueryCache');

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

const cache = new DynamicQueryCache(SQL);
cache.addDynamicCondition('%%NAME_CONDITIONS%%', (i) => `(street.names.name=$name${i})`);
cache.addDynamicCondition('%%POINT_CONDITIONS%%', (i) => `(
  street.rtree.minX<$point${i}x AND street.rtree.maxX>$point${i}x AND
  street.rtree.minY<$point${i}y AND street.rtree.maxY>$point${i}y
)`);

module.exports = function( db, names, points ){

  // error checking
  if( !names || !names.length || !points || !points.length ){
    return [];
  }

  // total amount of names/points to consider for search
  const nameCount = Math.min(names.length, MAX_NAMES);
  const pointCount = Math.min(points.length, MAX_POINTS);

  // get  prepared statement from cache (or generate one if not yet cached)
  const stmt = cache.getStatement(db, nameCount, pointCount);

  // create a variable array of params to bind to query
  var params = {};

  // add points
  points.slice(0, pointCount).forEach((point, i) => {
    params[`point${i}x`] = point.lon;
    params[`point${i}y`] = point.lat;
  });

  // add names
  names.slice(0, nameCount).forEach((name, i) => {
    params[`name${i}`] = name;
  });

  // execute statement
  return stmt.all(params);
};
