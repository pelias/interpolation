
var tty = require('tty'),
    tiger = require('../api/tiger');

// help text
if( process.argv.length !== 4 ){
  console.error('invalid args.');
  console.error('usage: {addressdb} {streetdb}');
  console.error('example: cat shapefile.shp | node cmd/tiger address.db street.db');
  process.exit(1);
}

if( tty.isatty( process.stdin ) ){
  console.error('no data piped to stdin');
  process.exit(1);
}

// run script
tiger( process.stdin, process.argv[2], process.argv[3] );
