
var sqlite3 = require('sqlite3'),
    Table = require('cli-table2'),
    requireDir = require('require-dir'),
    query = requireDir('./query');

// // wellington, nz
// var params = {
//   $lat: -41.288788,
//   $lon: 174.766843,
//   $name: 'glasgow street'
// };

// // nyc
// var params = {
//   $lat: 40.747625,
//   $lon: -73.9981,
//   $name: 'west 26th street'
// };

if( process.argv.length < 5 ){
  console.error("invalid args.");
  console.error("usage: {dbname} {lat} {lon} {name}");
  console.error("example: node interpolate example/example.db \"-41.288788\" \"174.766843\" \"glasgow street\"");
  process.exit(1);
}

// name of sqlite file
var dbfile = ( process.argv.length > 2 ) ? process.argv[2] : 'example.db';

// connect to db
sqlite3.verbose();
var db = new sqlite3.Database(dbfile, sqlite3.OPEN_READONLY);

function main(){
  db.serialize(function() {

    var params = {
      $lat: process.argv[3],
      $lon: process.argv[4],
      $name: process.argv[5]
    };

    query.address( db, params, function( err, res ){

      printTable( res );

      // console.error( err, res );
    });

    db.close();
  });
}

// db.loadExtension('mod_spatialite', main);
main();

function printTable( res ){

  // invalid results
  if( !Array.isArray(res) || !res.length ){ return; }

  var table = new Table({
    head: Object.keys( res[0] )
  });

  res.forEach( function( row ){
    var vals = [];
    for( var attr in row ){
      vals.push( row[attr] || '' );
    }
    table.push( vals );
  });

  console.error(table.toString());
}
