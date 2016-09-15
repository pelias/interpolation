
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    stream = requireDir('./stream'),
    query = requireDir('./query');

// name of sqlite file
var dbfile = ( process.argv.length > 2 ) ? process.argv[2] : 'example.db';

// connect to db
sqlite3.verbose();
var db = new sqlite3.Database(dbfile);

function main(){
  db.serialize(function() {
    query.configure(db); // configure database
    query.createTables(db, true); // reset database and create tables
  });

  // run pipeline
  process.stdin
    .pipe( stream.split() ) // split on newline
    .pipe( stream.polyline() ) // parse polyline data
    .pipe( stream.augmenter() ) // augment data with libpostal
    .pipe( stream.batcher() ) // batch up transactions
    .pipe( stream.dbwriter( db, function(){

      // create the indexes after the data is imported
      // for performance reasons.
      query.createIndexes(db, function(){

        // close the db handle when done
        db.close();

      });
    })); // save to db
}

// db.loadExtension('mod_spatialite', main);
main();
