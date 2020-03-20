const osm = require('../api/osm');

// help text
if( process.argv.length !== 4 ){
  console.error('invalid args.');
  console.error('usage: {addressdb} {streetdb}');
  console.error('example: cat osm.addresses.json | node cmd/osm address.db street.db');
  process.exit(1);
}

if( process.stdin.isTTY ){
  console.error('no data piped to stdin');
  process.exit(1);
}

// run script
osm( process.stdin, process.argv[2], process.argv[3] );
