
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    stream = requireDir('./stream', { recurse: true }),
    query = requireDir('./query');

// name of sqlite file
var dbfile = ( process.argv.length > 2 ) ? process.argv[2] : 'example.db';

// connect to db
sqlite3.verbose();
var db = new sqlite3.Database(dbfile);

function main(){
  query.configure(db); // configure database

  // run pipeline
  process.stdin
    .pipe( stream.oa.parse() ) // parse openaddresses csv data
    .pipe( stream.oa.batch() ) // batch records on the same street
    .pipe( stream.oa.lookup( db ) ) // look up from db
    .pipe( stream.oa.augment() ) // perform interpolation
    .pipe( stream.batch( 1000 ) ) // batch up data to import
    .pipe( stream.oa.import( db, function(){

      // close the db handle when done
      db.close();

    })); // save to db
}

main();
