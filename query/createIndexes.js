
module.exports = function( db, done ){
  db.serialize(function(){

    db.run("CREATE INDEX name_idx ON street_names(name);");
    db.run("CREATE INDEX source_idx ON street_address(housenumber);");
    db.run("CREATE INDEX housenumber_idx ON street_address(housenumber);");

    db.wait(done);
  });
};
