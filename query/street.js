const _ = require('lodash');

const SQL = `
  SELECT * FROM polyline
  JOIN names ON polyline.id = names.id
  WHERE polyline.id IN ( %%IDS%% )
  LIMIT 10
`;

// SQL prepared statements dont easily support variable length inputs.
// This function dynamically generates a SQL query based on the number
// of 'id' conditions required.
function generateDynamicSQL(idCount) {
  const conditions = _.times(idCount, (i) => `?`);
  return SQL.replace('%%IDS%%', conditions.join(','));
}

// Reusing prepared statements can have a ~10% perf benefit
// Note: the cache is global and so must be unique per database.
const cache = [];
function statementCache(db, idCount) {
  const key = `${idCount}:${db.name}`;
  if (!cache[key]) {
    cache[key] = db.prepare(generateDynamicSQL(idCount));
  }
  return cache[key];
}

module.exports = function( db, ids ){
  const stmt = statementCache(db, ids.length);

  // execute statement
  return stmt.all(ids);
};
