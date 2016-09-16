
module.exports = function( db, cb ){

  // create index on name (major performance improvement)
  db.run("CREATE INDEX name_index ON street_names(name);", function(){

    // create indexes on street_address table
    db.run("CREATE INDEX source_index ON street_address(source);", function(){
      db.run("CREATE INDEX housenumber_index ON street_address(housenumber);", cb);
    });
  });

};
