const logger = require('pelias-logger').get('interpolation');

/**
 * Attach specified database file under the specified name
 *
 * @param {better-sqlite3.Database} db
 * @param {string} path
 * @param {string} name
 * @throws Error
 */
module.exports = function( db, path, name ){

  const sql = `ATTACH DATABASE \'${path}\' as \'${name}\';`;

  try {
    db.prepare(sql).run();
    logger.debug(`successfully attached database ${path} as ${name}`);
  }
  catch (err) {
    logger.error(`failed to attach database ${path} as ${name}`);
    throw new Error(`failed to attach database ${path} as ${name}`, err);
  }
};
