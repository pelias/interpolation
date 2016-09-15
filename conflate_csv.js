
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    stream = requireDir('./stream'),
    query = requireDir('./query');

// name of sqlite file
var dbfile = ( process.argv.length > 2 ) ? process.argv[2] : 'example.db';

// connect to db
sqlite3.verbose();
var db = new sqlite3.Database(dbfile/*, sqlite3.OPEN_READONLY*/);

function main(){
  db.serialize(function() {
    query.configure(db); // configure database
  });

  // run pipeline
  process.stdin
    .pipe( stream.csv() ) // parse csv data
    .pipe( stream.batchstreets() ) // batch records on the same street
    .pipe( stream.dblookup( db ) ); // look up from db
}

// db.loadExtension('mod_spatialite', main);
main();
