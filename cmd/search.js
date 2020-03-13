
var search = require('../api/search');

// help text
if( process.argv.length < 8 || process.argv.length > 9 ){
  console.error('invalid args.');
  console.error('usage: {addressdb} {streetdb} {lat} {lon} (number} {name}');
  console.error('example: node cmd/search address.db street.db "-41.288788" "174.766843" "14" "glasgow street"');
  process.exit(1);
}

var conn = search( process.argv[2], process.argv[3] );
var number = process.argv[6];
var street = process.argv[7];

var point = {
  lat: parseFloat( process.argv[4] ),
  lon: parseFloat( process.argv[5] )
};

conn.query( point, number, street, function( err, res ){

  if( err ){
    return console.error( err );
  }

  if( !res ){
    return console.error( '0 results found' );
  }

  for( var attr in res ){
    console.log( attr + '\t' + res[attr] );
  }

});

conn.close();
