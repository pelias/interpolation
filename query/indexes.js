
module.exports.street = function( db ){
  // names
  db.exec('CREATE INDEX IF NOT EXISTS names_id_idx ON names(id);');
  db.exec('CREATE INDEX IF NOT EXISTS names_name_idx ON names(name, id);');
};

module.exports.address = function( db ){
  // create an index on street id
  db.exec('CREATE INDEX IF NOT EXISTS address_id_idx ON address(id);');

  // create an unique index on housenumber, this ensures we only store copy of each
  // db.exec('CREATE UNIQUE INDEX IF NOT EXISTS housenumber_uniq_idx ON address(housenumber);');

  // these indices are not strictly required and consume a large amount of disk space
  // db.exec('CREATE INDEX IF NOT EXISTS address_source_idx ON address(source);');
  // db.exec('CREATE INDEX IF NOT EXISTS address_parity_idx ON address(parity);');
  // db.exec('CREATE INDEX IF NOT EXISTS address_housenumber_idx ON address(housenumber);');
};
