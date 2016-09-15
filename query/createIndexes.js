
module.exports = function( db, cb ){

  // create index on name (major performance improvement)
  db.run("CREATE INDEX name_index ON street_names(name);", cb);

}
