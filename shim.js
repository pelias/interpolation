
var os = require('os');
var path = require('path');
var through = require('through2');
var fork = require('./lib/through2-fork');

var requireDir = require('require-dir'),
    stream = requireDir('./stream', { recurse: true });

// var maxWorkers = os.cpus().length -3;
var maxWorkers = 1;
var parsers = [];

// database import worker
var importer = fork( 'node', [ path.resolve( __dirname, './polyline_import_worker.js' ), 'foo.db' ] );
importer.child.stdin.pipe( process.stdout );
importer.child.stdout.pipe( process.stdout );
importer.child.stderr.pipe( process.stderr );

// parser workers
for( var x=0; x<maxWorkers; x++ ){
  var parser = fork( 'node', [ path.resolve( __dirname, './polyline_parser_worker.js' ) ] );

  // parser.stdin.pipe( process.stdout );
  // parser.stdout.pipe( process.stdout );
  // parser.stderr.pipe( process.stderr );

  parser.pipe( through( function( chunk, _, next ){
    // console.error( 'parser pipe', chunk.toString('utf8'), typeof chunk );
    importer.write( chunk );
    next();
  }, function flush(next){
    importer.end();
    next();
  }));

  parsers.push( parser );
}

// roundrobin
var rr = 0;

process.stdin.pipe( stream.split() ) // split on newline
             .pipe( through( function( chunk, _, next ){
                // console.error( chunk.toString('utf8'), typeof chunk );
                parsers[rr].write( chunk.toString('utf8') + '\n', next );
                rr++; if( rr >= parsers.length ){ rr=0; }
              }, function flush( next ){
                parsers.forEach( function( parser ){
                  console.error( 'parser end' );
                  parser.end();
                });
                next();
              }));

importer.pipe( process.stdout );
