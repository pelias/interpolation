
module.exports = function( db, done ){
  db.serialize(function(){

    // street_names
    db.run("CREATE INDEX names_id_idx ON street_names(id);");
    db.run("CREATE INDEX names_name_idx ON street_names(name);");

    // street_address
    db.run("CREATE INDEX address_id_idx ON street_address(id);");
    db.run("CREATE INDEX address_source_idx ON street_address(source);");
    db.run("CREATE INDEX address_housenumber_idx ON street_address(housenumber);");

    db.wait(done);
  });
};
