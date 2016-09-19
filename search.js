
var sqlite3 = require('sqlite3'),
    pretty = require('./lib/pretty'),
    query = { address: require('./query/address') };

// help text
if( process.argv.length < 5 ){
  console.error("invalid args.");
  console.error("usage: {dbname} {lat} {lon} {name}");
  console.error("example: node search example/example.db \"-41.288788\" \"174.766843\" \"glasgow street\"");
  process.exit(1);
}

// name of sqlite file
var dbfile = ( process.argv.length > 2 ) ? process.argv[2] : 'example.db';

// connect to db
sqlite3.verbose();
var db = new sqlite3.Database(dbfile, sqlite3.OPEN_READONLY);

function main(){
  db.serialize(function() {

    // perform a db lookup for the specified street
    query.address( db, {
      $lat: process.argv[3],
      $lon: process.argv[4],
      $name: process.argv[5]
    }, function( err, res ){

      // console.log( pretty.geojson( res ) );
      console.log( pretty.table( res ) );
    });

    db.close();
  });
}

main();
