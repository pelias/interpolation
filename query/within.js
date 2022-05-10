const DynamicQueryCache = require('./DynamicQueryCache');

// Remove before PR.
const logger = require('pelias-logger').get('interpolation');

/**
  find all streets which have a bbox which envelops the specified point; regardless of their names.
**/

const SQL = `
  SELECT street.polyline.id, street.polyline.line, street.names.name FROM street.polyline
  JOIN street.rtree ON street.rtree.id = street.polyline.id
  JOIN street.names ON street.names.id = street.polyline.id
  WHERE ((street.rtree.minX + street.rtree.maxX) / 2 BETWEEN $topLeftLon AND $bottomRightLon 
  AND (street.rtree.minY + street.rtree.maxY) / 2 BETWEEN $bottomRightLat AND $topLeftLat )
  GROUP BY street.polyline.id;
`;

const cache = new DynamicQueryCache(SQL);

module.exports = ( db, topLeft, bottomRight) => {

  // use a prepared statement from cache (or generate one if not yet cached)
  const stmt = cache.getStatement(db);

  // execute statement
  return stmt.all({
    topLeftLat: topLeft.lat,
    topLeftLon: topLeft.lon,
    bottomRightLat: bottomRight.lat,
    bottomRightLon: bottomRight.lon,
  });
};
