
module.exports = function( db, path, name, done ){

  var sql = `ATTACH DATABASE '$path' as '$name'`;
  sql = sql.replace( '$path', path );
  sql = sql.replace( '$name', name );

  db.serialize(function(){
    // db.run(sql);
    db.db.prepare(sql).run()
    console.error(sql)
    console.error('database_list', db.db.prepare('PRAGMA database_list').all())
    console.error('db.db', db.db)
    db.wait(done);
  });
};
