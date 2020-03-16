const DynamicQueryCache = require('./DynamicQueryCache');
const cache = new DynamicQueryCache(`
  SELECT * FROM polyline
  JOIN names ON polyline.id = names.id
  WHERE polyline.id IN ( %%IDS%% )
  LIMIT 10
`);
cache.addDynamicCondition('%%IDS%%', (i) => `?`, ',');

module.exports = (db, ids) => {
  return cache.getStatement(db, ids.length).all(ids);
};
