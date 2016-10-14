
module.exports = function( db, path, name, done ){

  var sql = 'ATTACH DATABASE \'$path\' as \'$name\';';
  sql = sql.replace( '$path', path );
  sql = sql.replace( '$name', name );

  db.serialize(function(){
    db.run(sql);
    db.wait(done);
  });
};
