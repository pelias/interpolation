const DynamicQueryCache = require('./DynamicQueryCache');

// maximum names to match on
const MAX_NAMES = 10;

// maximum address records to return
const MAX_MATCHES = 5000; // note: this query should only be used for debugging purposes

const SQL = `
  SELECT address.* FROM street.rtree
  JOIN street.names ON street.names.id = street.rtree.id
  JOIN address ON address.id = street.rtree.id
  WHERE (
    street.rtree.minX<=$lon AND street.rtree.maxX>=$lon AND
    street.rtree.minY<=$lat AND street.rtree.maxY>=$lat
  )
  AND ( %%NAME_CONDITIONS%% )
  ORDER BY address.housenumber ASC -- @warning business logic depends on this
  LIMIT ${MAX_MATCHES};
`;

const cache = new DynamicQueryCache(SQL);
cache.addDynamicCondition('%%NAME_CONDITIONS%%', (i) => `(street.names.name=$name${i})`);

module.exports = function( db, point, names ){

  // error checking
  if( !names || !names.length ){
    return [];
  }

  // total amount of names to consider for search
  const nameCount = Math.min(names.length, MAX_NAMES);

  // use a prepared statement from cache (or generate one if not yet cached)
  const stmt = cache.getStatement(db, nameCount);

  // query params
  const params = {
    lon: point.lon,
    lat: point.lat,
  };

  // each name is added in the format: $name0=x, $name1=y
  names.slice(0, nameCount).forEach((name, pos) => {
    params[`name${pos}`] = name;
  });

  // execute query
  return stmt.all(params);
};
