
var reverse = require('../api/reverse');

// help text
if( process.argv.length < 6 || process.argv.length > 7 ){
  console.error('invalid args.');
  console.error('usage: {addressdb} {streetdb} {lat} {lon}');
  console.error('example: node cmd/reverse address.db street.db "-41.288788" "174.766843"');
  process.exit(1);
}

var conn = reverse( process.argv[2], process.argv[3] );

var point = {
  lat: parseFloat( process.argv[4] ),
  lon: parseFloat( process.argv[5] )
};

conn.query( point, function( err, res ){

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
