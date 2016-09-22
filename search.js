
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    pretty = require('./lib/pretty'),
    query = requireDir('./query');

// help text
if( process.argv.length < 7 ){
  console.error("invalid args.");
  console.error("usage: {addressdb} {streetdb} {lat} {lon} {name}");
  console.error("example: node search address.db street.db \"-41.288788\" \"174.766843\" \"glasgow street\"");
  process.exit(1);
}

// name of sqlite file
var dbfile = ( process.argv.length > 2 ) ? process.argv[2] : 'example.db';

// connect to db
sqlite3.verbose();
var db = new sqlite3.Database(dbfile, sqlite3.OPEN_READONLY);

function main(){

  // attach street database
  query.attach(db, process.argv[3], 'street');

  // perform a db lookup for the specified street
  query.address( db, {
    $lat: process.argv[4],
    $lon: process.argv[5],
    $name: process.argv[6]
  }, function( err, res ){

    // console.log( pretty.geojson( res ) );
    console.log( pretty.table( res ) );
  });

  db.close();
}

main();
