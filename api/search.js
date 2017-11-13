
const Database = require('better-sqlite3');
const requireDir = require('require-dir');
const query = requireDir('../../query');

const queryFunc = require('./queryFunction');

// export setup method
function setup( addressDbPath, streetDbPath ){

  // connect to db
  const dbOptions = {
    memory: false,
    readonly: true,
    fileMustExist: true
  };
  const db = new Database( addressDbPath, dbOptions );

  // attach street database
  // this will throw an exception if something goes wrong
  query.attach_better( db, streetDbPath, 'street' );

  // return methods
  return {
    query: queryFunc.bind(null, db),

    // close method to close db
    close: db.close.bind( db ),
  };
}

module.exports = setup;
