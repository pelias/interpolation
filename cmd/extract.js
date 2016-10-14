
var extract = require('../api/extract'),
    pretty = require('../lib/pretty');

// help text
if( process.argv.length !== 7 ){
  console.error('invalid args.');
  console.error('usage: {addressdb} {streetdb} {lat} {lon} {name}');
  console.error('example: node cmd/extract address.db street.db "-41.288788" "174.766843" "glasgow street"');
  process.exit(1);
}

var conn = extract( process.argv[2], process.argv[3] );
var names = [ process.argv[6] ];

var point = {
  lat: parseFloat( process.argv[4] ),
  lon: parseFloat( process.argv[5] )
};

// optionally pass 'geojson' as the 7th arg to get json output
var renderer = ( process.argv[7] === 'geojson' ) ? pretty.geojson : pretty.table;

conn.query( point, names, function( err, res ){

  if( !res ){
    return console.error( '0 results found' );
  }

  if( renderer === pretty.geojson ){
    console.log( JSON.stringify( renderer( res ), null, 2 ) );
  } else {
    console.log( renderer( res ) );
  }

});

conn.close();
