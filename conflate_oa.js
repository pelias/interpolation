
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    stream = requireDir('./stream', { recurse: true }),
    query = requireDir('./query');

// help text
if( process.argv.length < 4 ){
  console.error("invalid args.");
  console.error("usage: {addressdb} {streetdb}");
  console.error("example: cat openaddresses.csv | node conflate_oa oa.db planet.db");
  process.exit(1);
}

// connect to db
sqlite3.verbose();
var db = new sqlite3.Database( process.argv[2] );

function main(){
  query.configure(db); // configure database
  query.tables.address(db, true); // reset database and create tables
  query.attach(db, process.argv[3], 'street'); // attach street database

  // run pipeline
  process.stdin
    .pipe( stream.oa.parse() ) // parse openaddresses csv data
    .pipe( stream.oa.batch() ) // batch records on the same street
    .pipe( stream.oa.lookup( db ) ) // look up from db
    .pipe( stream.oa.augment() ) // perform interpolation
    .pipe( stream.batch( 100 ) ) // batch up data to import
    .pipe( stream.oa.import( db, function(){

      // create the indexes after the data is imported
      // for performance reasons.
      query.indexes.address(db, function(){

        // close the db handle when done
        db.close();

      });

    })); // save to db
}

main();
