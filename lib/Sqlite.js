const os = require('os');
const path = require('path');
const crypto = require('crypto');
const USE_BETTER_SQLIITE3 = true;

if(!USE_BETTER_SQLIITE3){
  const sqlite3 = require('sqlite3');
  module.exports = sqlite3;
}

else {
  let globalVerbose = false;
  const BetterSqlite3 = require('better-sqlite3');

  const is = (cb) => {
    return ('function' === typeof cb);
  };

  const compatibleArgs = (args) => {
    let compatibleArgs = {};
    for (let attr in args) {
      let a = attr;
      if (attr.startsWith('$')) { a = attr.slice(1); }
      compatibleArgs[a] = args[attr];
    }
    return compatibleArgs;
  };

  class BackwardsCompatibileStatement {
    constructor(db, sql) {
      this.stmt = db.prepare(sql);
    }
    all(args, cb) {
      try {
        const rows = this.stmt.all(compatibleArgs(args));
        if(is(cb)){ cb(null, rows || []); }
      } catch (e) {
        console.error(e);
        if(is(cb)){ cb(e); }
      }
    }
    get(args, cb) {
      try {
        const row = this.stmt.get(compatibleArgs(args));
        if(is(cb)){ cb(null, row || undefined); }
      } catch (e) {
        console.error(e);
        if(is(cb)){ cb(e); }
      }
    }
    run(args, cb) {
      try {
        const info = this.stmt.run(compatibleArgs(args));
        if(is(cb)){
          cb.call({
            changes: info.changes,
            lastID: info.lastInsertRowid
          }, null);
        }
      } catch (e) {
        console.error(e);
        if(is(cb)){ cb(e); }
      }
    }
  }

  // const cache = {}
  const flags = {
    OPEN_READONLY: 1
  };

  const logger = (...args) => {
    if (!globalVerbose) { return; }
    console.log(...args);
  };

  class BackwardsCompatibileDatabase {
    constructor(filename, mode){
      const options = {
        verbose: logger,
        memory: (filename === ':memory:'),
        readonly: ((flags.OPEN_READONLY & mode) > 0),
        fileMustExist: ((1 & mode) > 0)
      };
      if (options.memory){
        const tmpName = path.join(os.tmpdir(), 'temp' + crypto.randomBytes(20).toString('hex') + '.db');
        filename = tmpName;
      }
      this.db = new BetterSqlite3(filename, options);
    }
    close(cb){
      this.db.close();
      if(is(cb)){ cb(); }
    }
    transaction(cb) {
      if (!is(cb)) {
        throw new Error('transaction requires callback');
      }
      return this.db.transaction(cb);
    }
    prepare(sql, cb) {
      try {
        const stmt = new BackwardsCompatibileStatement(this.db, sql);
        if(is(cb)){ cb(); }
        return stmt;
      } catch (e) {
        console.error(e);
        if(is(cb)){ cb(e); }
        throw e;
      }
    }
    // proxy
    exec(sql) {
      return this.db.exec(sql);
    }
  }

  module.exports = {
    OPEN_READONLY: flags.OPEN_READONLY,
    verbose: () => { globalVerbose = true; },
    Database: BackwardsCompatibileDatabase
  };
}
