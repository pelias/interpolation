
var tty = require('tty'),
    oa = require('../api/oa');

// help text
if( process.argv.length !== 4 ){
  console.error('invalid args.');
  console.error('usage: {addressdb} {streetdb}');
  console.error('example: cat openaddresses.csv | node cmd/oa address.db street.db');
  process.exit(1);
}

if( tty.isatty( process.stdin ) ){
  console.error('no data piped to stdin');
  process.exit(1);
}

// run script
oa( process.stdin, process.argv[2], process.argv[3] );
