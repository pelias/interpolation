const _ = require('lodash');

const validateBaseQuery = (query) => {
  if (!_.isString(query) || _.isEmpty(query)) {
    throw new Error('invalid base query');
  }
};

const validatePlaceholder = (placeholder, sql) => {
  if (!_.isString(placeholder) || _.isEmpty(placeholder)) {
    throw new Error('invalid placeholder');
  }
  if (!sql.includes(placeholder)) {
    throw new Error('sql does not contain placeholder');
  }
};

const validateMapFunction = (map) => {
  if (!_.isFunction(map) || map.length !== 1) {
    throw new Error('invalid map function');
  }
};

const validateDelimiter = (delim) => {
  if (!_.isString(delim) || _.isEmpty(delim)) {
    throw new Error('invalid delimiter');
  }
};

const validateCount = (count) => {
  if (!_.isFinite(count) || count <= 0) {
    throw new Error('invalid count');
  }
};

const validateTotalRequiredCounts = (conditions, counts) => {
  if (conditions.length !== counts.length) {
    throw new Error(`invalid counts supplied ${counts.length}, requires ${conditions.length}`);
  }
};

class DynamicQueryCache {
  constructor(baseQuery){
    validateBaseQuery(baseQuery);
    this.sql = baseQuery;
    this.cache = {};
    this.conditions = [];
  }
  addDynamicCondition(placeholder, map, delimiter = 'OR') {
    validatePlaceholder(placeholder, this.sql);
    validateMapFunction(map);
    validateDelimiter(delimiter);
    this.conditions.push({placeholder, map, delimiter});
  }
  _generateDynamicSQL(...dynamicCounts) {
    dynamicCounts.forEach(validateCount);
    validateTotalRequiredCounts(this.conditions, dynamicCounts);
    let sql = this.sql;
    dynamicCounts.forEach((count, i) => {
      const condition = this.conditions[i];
      const replacement = _.times(count, condition.map).join(` ${condition.delimiter} `);
      sql = sql.replace(condition.placeholder, replacement);
    });
    return sql;
  }
  getStatement(db, ...dynamicCounts){
    const key = [db.name].concat(dynamicCounts).join(':');
    if (!_.has(this.cache, key)) {
      const sql = this._generateDynamicSQL(...dynamicCounts);
      this.cache[key] = db.prepare(sql);
    }
    return this.cache[key];
  }
}

module.exports = DynamicQueryCache;
