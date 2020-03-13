const os = require('os');
const path = require('path');
const crypto = require('crypto');
const USE_BETTER_SQLIITE3 = true;

if(!USE_BETTER_SQLIITE3){
  const sqlite3 = require('sqlite3');
  module.exports = sqlite3;
}

else {
  let verbose = false;
  const better3 = require('better-sqlite3');

  const is = (cb) => {
    return ('function' === typeof cb);
  }

  // const maybe = (cb) => {
  //   // if (is(cb)) { process.nextTick(() => {
  //   //   cb()
  //   // })}
  //   is(cb) && cb()
  // }

  const hasReturnValue = (sql) => {
    // console.error('hasReturnValue', sql)
    if (sql.includes('ATTACH DATABASE')){
      return false
    } else if (sql.includes('PRAGMA ') && sql.includes('mmap_size=')) {
      return true
    } else if (sql.includes('PRAGMA ') && sql.includes('=')) {
      return false
    } else if (sql.includes('CREATE') && sql.includes('TABLE')) {
      return false
    } else if (sql.includes('CREATE') && sql.includes('INDEX')) {
      return false
    } else if (sql.includes('DROP') && sql.includes('TABLE')) {
      return false
    } else if (sql.includes('DROP') && sql.includes('INDEX')) {
      return false
    } else if (sql.includes('INSERT INTO')) {
      return false
    } else if (sql.includes('BEGIN TRANSACTION') || sql.includes('END TRANSACTION')) {
      return false
    }
    return true
  }

  const compatibleArgs = (args) => {
    let compatibleArgs = {}
    for (let attr in args) {
      let a = attr;
      if (attr.startsWith('$')) { a = attr.slice(1) }
      compatibleArgs[a] = args[attr]
    }
    return compatibleArgs
  }

  class BackwardsCompatibileStatement {
    constructor(db, sql) {
      // console.error('prepare', sql)
      this.stmt = db.prepare(sql);
    }
    all(args, cb) {
      try {
        const rows = this.stmt.all(compatibleArgs(args));
        is(cb) && cb(null, rows || []);
      } catch (e) {
        console.error(e);
        is(cb) && cb(e);
      }
    }
    get(args, cb) {
      try {
        const row = this.stmt.get(compatibleArgs(args));
        is(cb) && cb(null, row || undefined);
      } catch (e) {
        console.error(e);
        is(cb) && cb(e);
      }
    }
    run(args, cb) {
      try {
        const info = this.stmt.run(compatibleArgs(args));
        is(cb) && cb.bind({
          changes: info.changes,
          lastID: info.lastInsertRowid
        })(null);
      } catch (e) {
        console.error(e);
        is(cb) && cb(e);
      }
    }
    finalize(cb) {
      is(cb) && cb();
    }
  }

  // const cache = {}
  const flags = {
    OPEN_READONLY: 1
  }

  class BackwardsCompatibileDatabase {
    constructor(filename, mode){
      const options = {
        // verbose: !!(verbose) ? console.log : undefined,
        // verbose: console.log,
        memory: (filename === ':memory:'),
        readonly: ((flags.OPEN_READONLY & mode) > 0),
        fileMustExist: ((1 & mode) > 0)
      }
      if (options.memory){
        const tmpName = path.join(os.tmpdir(), 'temp' + crypto.randomBytes(20).toString('hex') + '.db');
        // const tmpName = path.join(os.tmpdir(), 'temp-foo.db');
        filename = tmpName
      }
      console.error('open', filename, mode)
      console.error('open', filename, options)
      console.error(new Error().stack)
      // if(cache.hasOwnProperty(filename)){
      //   this.db = cache[filename]
      // } else {
        this.db = new better3(filename, options)
        // cache[filename] = this.db;
      // }
      // console.error(this.db.prepare('PRAGMA synchronous=FULL').run())
      // console.error(this.db.prepare('PRAGMA database_list').all())
      // console.error(new Error().stack)
      // console.error('sqlite_master', this.db.prepare('SELECT * FROM sqlite_master').all())
    }
    close(cb){
      // console.error('close')
      // console.error(new Error().stack)
      // this.db.prepare('VACUUM').run()
      // this.db.close() // <------------------------------------<<<<<<
      is(cb) && cb();
    }
    transaction(cb) {
      if (!is(cb)) {
        throw new Error('transaction requires callback');
      }
      return this.db.transaction(cb)
    }
    serialize(cb) {
      is(cb) && cb()
      // return this.transaction(cb)()
    }
    wait(cb) { is(cb) && cb() }
    prepare(sql, cb) {
      try {
        const stmt = new BackwardsCompatibileStatement(this.db, sql);
        is(cb) && cb()
        return stmt;
      } catch (e) {
        console.error(e);
        is(cb) && cb(e);
        throw e;
      }
    }
    run(sql, cb) {
      console.error('db.run', sql);
      try {
        const stmt = this.db.prepare(sql);
        if (hasReturnValue(sql)){
          // console.error('db.run GET', sql);
          const row = stmt.get();
          is(cb) && cb(null, row);
        } else {
          // console.error('db.run RUN', sql);
          const info = stmt.run();
          is(cb) && cb.bind({
            changes: info.changes,
            lastID: info.lastInsertRowid
          })(null);
        }
      } catch(e){
        console.error(e);
        is(cb) && cb(e);
      }
      // try {
      //   // console.error(sql);
      //   this.db.exec(sql);
      //   is(cb) && cb(null);
      // } catch (e) {
      //   console.error(e);
      //   is(cb) && cb(e);
      // }
    }
    all(sql, cb) {
      try {
        // console.error(sql);
        const stmt = this.db.prepare(sql);
        const rows = stmt.all();
        is(cb) && cb(null, rows || []);
      } catch (e) {
        console.error(e);
        is(cb) && cb(e);
      }
    }
    get(sql, cb) {
      try {
        // console.error(sql);
        const stmt = this.db.prepare(sql);
        const row = stmt.get();
        is(cb) && cb(null, row || undefined);
      } catch (e) {
        console.error(e);
        is(cb) && cb(e);
      }
    }
  }

  module.exports = {
    OPEN_READONLY: flags.OPEN_READONLY,
    verbose: () => { verbose = true },
    Database: BackwardsCompatibileDatabase
  }
}
