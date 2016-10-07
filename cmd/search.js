
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    pretty = require('../lib/pretty'),
    query = requireDir('../query'),
    analyze = require('../lib/analyze');

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
var db = new sqlite3.Database( dbfile, sqlite3.OPEN_READONLY );

// attach street database
query.attach(db, process.argv[3], 'street');

var point = {
  lat: parseFloat( process.argv[4] ),
  lon: parseFloat( process.argv[5] )
};

var names = analyze.street(process.argv[6]);

// perform a db lookup for the specified street
query.address( db, point, names, function( err, res ){

  if( !res ){
    return console.error( "0 results found" );
  }

  // console.log( pretty.geojson( res ) );
  console.log( pretty.table( res ) );
});

db.close();
