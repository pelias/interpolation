const _ = require('lodash');
const logger = require('pelias-logger').get('interpolation');

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
  `WITH base AS (`,
    `SELECT address.* FROM street.rtree`,
    `JOIN street.names ON street.names.id = street.rtree.id`,
    `JOIN address ON address.id = street.rtree.id`,
    `WHERE (`,
      `street.rtree.minX<=@lon AND street.rtree.maxX>=@lon AND`,
      `street.rtree.minY<=@lat AND street.rtree.maxY>=@lat`,
    `)`,
    `AND ( %%NAME_CONDITIONS%% )`,
    `ORDER BY address.housenumber ASC`, // @warning business logic depends on this
  `)`,
  `SELECT * FROM (`,
    `(`,
      `SELECT * FROM base`,
      `WHERE housenumber < @housenmbr`,
      `GROUP BY id HAVING( MAX( housenumber ) )`,
      `ORDER BY housenumber DESC`,
    `)`,
  `) UNION SELECT * FROM (`,
    `(`,
      `SELECT * FROM base`,
      `WHERE housenumber >= @housenmbr`,
      `GROUP BY id HAVING( MIN( housenumber ) )`,
      `ORDER BY housenumber ASC`,
    `)`,
  `)`,
  `ORDER BY housenumber ASC`, // @warning business logic depends on this
  `LIMIT ${MAX_MATCHES};`
].join(' ');

/**
 * sample results:
 *  rowid=77188,
 *  id=9353,
 *  source=OA,
 *  source_id=us/or/portland_metro:7ebedc8b8a6fc9dc,
 *  housenumber=3745,
 *  lat=45.5503511,
 *  lon=-122.5905319,
 *  parity=L,
 *  proj_lat=45.55035006263763,
 *  proj_lon=-122.59023003810346
 *
 * @param {better-sqlite3.Database} db
 * @param {object} point
 * @param {number} point.lat
 * @param {number} point.lon
 * @param {number} number :housenumber
 * @param {Array} names :all possible street name variations, such as ["west 26 street", "west 26 saint"]
 * @returns {Array}
 */
module.exports = ( db, point, number, names ) => {

  // error checking
  if( !names || !names.length ){
    logger.warn('[query/search] no names provided');
    return [];
  }

  const nameConditions = [];

  const params = _.reduce(
    // array of names, truncated to max_names length
    _.slice(names, 0, MAX_NAMES),
    // collection function
    (accum, name, key) => {
      accum[`name${key}`] = name;
      nameConditions.push(`street.names.name=@name${key}`);
      return accum;
    },
    // accumulator object
    {}
  );

  // create a variable array of params for the query
  params.lon = point.lon;
  params.lat = point.lat;
  params.housenmbr = number;

  // build unique sql statement
  const sql = SQL.replace( '%%NAME_CONDITIONS%%', nameConditions.join(' OR ') );

  // execute query
  try {
    const res = db.prepare( sql ).all( params );

    logger.debug(`successfully performed search query ${sql} with params ${JSON.stringify(params)}`);
    logger.debug('query results: ', res);

    return res;
  }
  catch (err) {
    logger.error(`failed to perform search query ${sql} with params ${JSON.stringify(params)} due to ${err.message}`);
    throw new Error(`failed to perform search query ${sql} with params ${JSON.stringify(params)} due to ${err.message}`, err);
  }
};
