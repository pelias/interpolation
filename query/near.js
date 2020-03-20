const DynamicQueryCache = require('./DynamicQueryCache');

/**
  find all streets which have a bbox which envelops the specified point; regardless of their names.
**/

// maximum street segments to return
var MAX_MATCHES = 100;

const SQL = `
  SELECT street.polyline.id, street.polyline.line, street.names.name FROM street.polyline
  JOIN street.rtree ON street.rtree.id = street.polyline.id
  JOIN street.names ON street.names.id = street.polyline.id
  WHERE (street.rtree.minX<$lon AND street.rtree.maxX>$lon AND street.rtree.minY<$lat AND street.rtree.maxY>$lat)
  GROUP BY street.polyline.id
  LIMIT ${MAX_MATCHES}
`;

const cache = new DynamicQueryCache(SQL);

module.exports = ( db, point ) => {

  // use a prepared statement from cache (or generate one if not yet cached)
  const stmt = cache.getStatement(db);

  // execute statement
  return stmt.all({
    lon: point.lon,
    lat: point.lat
  });
};
