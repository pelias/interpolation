const SQL = `
  SELECT * FROM polyline
  JOIN names ON polyline.id = names.id
  WHERE polyline.id IN ( %%IDS%% )
  LIMIT 10
`;

// SQL prepared statements dont easily support variable length inputs.
// This function dynamically generates a SQL query based on the number
// of 'id' conditions required.
function generateDynamicSQL(max) {
  const conditions = new Array(max.ids)
    .fill('$id')
    .map((sql, pos) => sql.replace('$id', `$id${pos}`));

  return SQL.replace('%%IDS%%', conditions.join(','));
}

// Reusing prepared statements can have a ~10% perf benefit
// Note: the cache is global and so must be unique per database.
const cache = [];
function statementCache(db, max) {
  const key = `${max.ids}:${db.name}`;
  if (!cache[key]) {
    cache[key] = db.prepare(generateDynamicSQL(max));
  }
  return cache[key];
}

module.exports = function( db, ids ){
  const stmt = statementCache(db, { ids: ids.length });

  // query params
  const params = {};

  // each name is added in the format: $id0=x, $id1=y
  ids.forEach((id, pos) => {
    params[`id${pos}`] = id;
  });

  // execute statement
  return stmt.all(params);
};
