const DynamicQueryCache = require('./DynamicQueryCache');

// maximum names to match on
const MAX_NAMES = 10;

// maximum address records to return
const MAX_MATCHES = 20;

/**
  this query should only ever return max 3 rows.
  note: the amount of rows returned does not adequently indicate whether an
  exact match was found or not.
**/

// @note: window functions were introduced to sqlite since this SQL was
// originally written, it may be possible to simplify the SQL using them.
// @see: https://sqlite.org/windowfunctions.html
const SQL = `
  WITH base AS (
    SELECT id, housenumber, rowid
    FROM address
    WHERE id IN (
      SELECT id
      FROM street.names
      WHERE id IN (
        SELECT id
        FROM street.rtree
        WHERE (
          street.rtree.minX<=$lon AND street.rtree.maxX>=$lon AND
          street.rtree.minY<=$lat AND street.rtree.maxY>=$lat
        )
      )
      AND ( %%NAME_CONDITIONS%% )
    )
  )
  SELECT * FROM address
  WHERE rowid IN (
    SELECT rowid FROM (
      SELECT * FROM base
      WHERE housenumber < $housenumber
      GROUP BY id HAVING( MAX( housenumber ) )
      ORDER BY housenumber DESC
    )
    UNION
    SELECT rowid FROM (
      SELECT * FROM base
      WHERE housenumber >= $housenumber
      GROUP BY id HAVING( MIN( housenumber ) )
      ORDER BY housenumber ASC
    )
  )
  ORDER BY housenumber ASC -- @warning business logic depends on this
  LIMIT ${MAX_MATCHES}
`;

const cache = new DynamicQueryCache(SQL);
cache.addDynamicCondition('%%NAME_CONDITIONS%%', (i) => `(street.names.name=$name${i})`);

module.exports = function( db, point, number, names ){
  // error checking
  if( !names || !names.length ){
    return [];
  }

  // total amount of names to consider for search
  const nameCount = Math.min( names.length, MAX_NAMES );

  // use a prepared statement from cache (or generate one if not yet cached)
  const stmt = cache.getStatement(db, nameCount);

  // query params
  const params = {
    lon: point.lon,
    lat: point.lat,
    housenumber: number
  };

  // each name is added in the format: $name0=x, $name1=y
  names.slice(0, nameCount).forEach((name, pos) => {
    params[`name${pos}`] = name;
  });

  // execute query
  return stmt.all(params);
};
