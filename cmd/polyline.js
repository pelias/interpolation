
var tty = require('tty'),
    polyline = require('../api/polyline');

// help text
if( process.argv.length < 3 ){
  console.error('invalid args.');
  console.error('usage: {streetdb}');
  console.error('example: cat street.polylines | node cmd/polyline street.db');
  process.exit(1);
}

if( tty.isatty( process.stdin ) ){
  console.error('no data piped to stdin');
  process.exit(1);
}

// run script
polyline( process.stdin, process.argv[2] );
