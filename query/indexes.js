module.exports.street = ( db ) => {
  // names
  db.exec(`CREATE INDEX IF NOT EXISTS names_id_idx ON names(id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS names_name_idx ON names(name, id)`);
};

module.exports.address = ( db ) => {
  // create an index on street id
  db.exec(`CREATE INDEX IF NOT EXISTS address_id_idx ON address(id)`);
};
