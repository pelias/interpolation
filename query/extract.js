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
  ORDER BY address.housenumber ASC // @warning business logic depends on this
  LIMIT ${MAX_MATCHES};
`;

// SQL prepared statements dont easily support variable length inputs.
// This function dynamically generates a SQL query based on the number
// of 'name' conditions required.
function generateDynamicSQL(max) {
  const conditions = new Array(max.names)
    .fill('(street.names.name=$name)')
    .map((sql, pos) => sql.replace('$name', `$name${pos}`));

  return SQL.replace('%%NAME_CONDITIONS%%', conditions.join(' OR '));
}

// Reusing prepared statements can have a ~10% perf benefit
// Note: the cache is global and so must be unique per database.
const cache = [];
function statementCache(db, max) {
  const key = `${max.names}:${db.name}`;
  if (!cache[key]) {
    cache[key] = db.prepare(generateDynamicSQL(max));
  }
  return cache[key];
}

module.exports = function( db, point, names ){

  // error checking
  if( !names || !names.length ){
    return [];
  }

  // max conditions to search on
  const max = { names: Math.min( names.length, MAX_NAMES ) };

  // use a prepared statement from cache (or generate one if not yet cached)
  const stmt = statementCache(db, max);

  // query params
  const params = {
    lon: point.lon,
    lat: point.lat,
  };

  // each name is added in the format: $name0=x, $name1=y
  names.slice(0, max.names).forEach((name, pos) => {
    params[`name${pos}`] = name;
  });

  // execute query
  return stmt.all(params);
};
