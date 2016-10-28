
var vertices = require('../api/vertices');

// help text
if( process.argv.length !== 4 ){
  console.error('invalid args.');
  console.error('usage: {addressdb} {streetdb}');
  console.error('example: node cmd/vertices address.db street.db');
  process.exit(1);
}

// run script
vertices( process.argv[2], process.argv[3] );
