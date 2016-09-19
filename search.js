
var sqlite3 = require('sqlite3'),
    Table = require('cli-table2'),
    requireDir = require('require-dir'),
    query = requireDir('./query');

// help text
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

    // perform a db lookup for the specified street
    query.address( db, {
      $lat: process.argv[3],
      $lon: process.argv[4],
      $name: process.argv[5]
    }, function( err, res ){

      // geojsonify( res );
      printTable( res );
    });

    db.close();
  });
}

main();

// print a pretty table of results
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

// print results as geojson
function geojsonify( res ){

  var point = function( row ){
    var p = {
      "type": "Feature",
      "properties": row,
      "geometry": {
        "type": "Point",
        "coordinates": [
          row.proj_lon,
          row.proj_lat
        ]
      }
    };

    if( row.source === 'VERTEX' ){
      p.properties['marker-color'] = "FFA500";
    }

    return p;
  };

  var geojson = {
    "type": "FeatureCollection",
    "features": []
  };

  // invalid results
  if( Array.isArray(res) && res.length ){
    res.forEach( function( row ){
      geojson.features.push( point( row ) );
    });
  }

  console.log( JSON.stringify( geojson, null, 2 ) );
}
