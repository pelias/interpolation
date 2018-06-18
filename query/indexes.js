
module.exports.street = function( db, done ){
  db.serialize(function(){

    // names
    db.run('CREATE INDEX IF NOT EXISTS names_id_idx ON names(id);');
    db.run('CREATE INDEX IF NOT EXISTS names_name_idx ON names(name, id);');

    db.wait(done);
  });
};

module.exports.address = function( db, done ){
  db.serialize(function(){

    // create an index on street id
    db.run('CREATE INDEX IF NOT EXISTS address_id_idx ON address(id);');

    // create an unique index on housenumber, this ensures we only store copy of each
    // db.run('CREATE UNIQUE INDEX IF NOT EXISTS housenumber_uniq_idx ON address(housenumber);');

    // these indices are not strictly required and consume a large amount of disk space
    // db.run('CREATE INDEX IF NOT EXISTS address_source_idx ON address(source);');
    // db.run('CREATE INDEX IF NOT EXISTS address_parity_idx ON address(parity);');
    // db.run('CREATE INDEX IF NOT EXISTS address_housenumber_idx ON address(housenumber);');

    db.wait(done);
  });
};
