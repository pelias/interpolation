
var through = require('through2'),
    requireDir = require('require-dir'),
    stream = requireDir('./stream', { recurse: true });

// name of sqlite file
var dbfile = ( process.argv.length > 2 ) ? process.argv[2] : 'example.db';

function main(){

  var child = require('child_process').fork('polyline_import_worker.js', [ dbfile ]);

  var sendToWorker = through.obj( function( item, _, next ){
    child.send( item, next );
  }, function flush(next){
    child.send( 'DONE' );
    next();
  });

  // run pipeline
  process.stdin
    .pipe( stream.split() ) // split on newline
    .pipe( stream.polyline.parse() ) // parse polyline data
    .pipe( stream.polyline.augment() ) // augment data with libpostal
    .pipe( sendToWorker ); // send to worker
}

main();
