// maximum names to match on
const MAX_NAMES = 10;

// maximum address records to return
const MAX_MATCHES = 20;

/**
  this query should only ever return max 3 rows.
  note: the amount of rows returned does not adequently indicate whether an
  exact match was found or not.
**/

const SQL = [
  'WITH base AS (',
    'SELECT id, housenumber, rowid',
    'FROM address',
    'WHERE id IN (',
      'SELECT id',
      'FROM street.names',
      'WHERE id IN (',
        'SELECT id',
        'FROM street.rtree',
        'WHERE (',
          'street.rtree.minX<=$lon AND street.rtree.maxX>=$lon AND',
          'street.rtree.minY<=$lat AND street.rtree.maxY>=$lat',
        ')',
      ')',
      'AND ( %%NAME_CONDITIONS%% )',
    ')',
  ')',
  'SELECT * FROM address',
  'WHERE rowid IN (',
    'SELECT rowid FROM (',
      'SELECT * FROM base',
      'WHERE housenumber < $housenumber',
      'GROUP BY id HAVING( MAX( housenumber ) )',
      'ORDER BY housenumber DESC',
    ')',
    'UNION',
    'SELECT rowid FROM (',
      'SELECT * FROM base',
      'WHERE housenumber >= $housenumber',
      'GROUP BY id HAVING( MIN( housenumber ) )',
      'ORDER BY housenumber ASC',
    ')',
  ')',
  'ORDER BY housenumber ASC', // @warning business logic depends on this
  `LIMIT ${MAX_MATCHES};`
].join(' ');

// SQL prepared statements dont easily support variable length inputs.
// This function dynamically generates a SQL query based on the number
// of 'name' conditions required.
function generateDynamicSQL(max){
  const conditions = new Array(max.names)
    .fill('(street.names.name=$name)')
    .map((sql, pos) => sql.replace('$name', `$name${pos}`));

  return SQL.replace('%%NAME_CONDITIONS%%', conditions.join(' OR '));
}

// Reusing prepared statements can have a ~10% perf benefit
// Note: the cache is global and so must be unique per database.
const cache = [];
function statementCache(db, max){
  const key = `${max.names}:${db.name}`;
  if (!cache[key]) {
    cache[key] = db.prepare(generateDynamicSQL(max));
  }
  return cache[key];
}

module.exports = function( db, point, number, names ){
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
    housenumber: number
  };

  // each name is added in the format: $name0=x, $name1=y
  names.slice(0, max.names).forEach((name, pos) => {
    params[`name${pos}`] = name;
  });

  // execute query
  return stmt.all(params);
};
