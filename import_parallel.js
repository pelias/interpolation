
var os = require('os');
var path = require('path');
var through = require('through2');
var child = require('./lib/through2-child');

var requireDir = require('require-dir'),
    stream = requireDir('./stream', { recurse: true });

var maxWorkers = Math.max( os.cpus().length -3, 1 );
console.error( 'maxWorkers', maxWorkers );
var parsers = [];

// database import worker
var importer = child.spawn( 'node', [ path.resolve( __dirname, './worker/polyline_import.js' ) ].concat( process.argv.slice(2)) );
importer.child.stdin.pipe( process.stdout );
importer.child.stdout.pipe( process.stdout );
importer.child.stderr.pipe( process.stderr );

// true/false if all streams in group have finished
var isGroupDone = function(){
  return parsers.every( function( p ){ return p._complete; });
};

// parser workers
function createParser(){
  var parser = child.spawn( 'node', [ path.resolve( __dirname, './worker/polyline_parser.js' ) ] );

  // stdout closed
  var flush = function( next ){

    // mark stream as done
    parser._complete = true;

    // only end once all parsers are complete
    if( isGroupDone() ){
      importer.child.stdin.end();
    }

    next();
  };

  // pipe child stdout to importer stdin
  parser.child.stdout.pipe( stream.split() )
                     .pipe( through( function( chunk, _, next ){
                        importer.child.stdin.write( chunk + "\n", next );
                      }, flush ));

  parsers.push( parser );
}

for( var x=0; x<maxWorkers; x++ ){
  createParser();
}

// roundrobin
var rr = 0;

// stream sequence
var seq = 0;

process.stdin.pipe( stream.split() ) // split on newline
             .pipe( through.obj( function( chunk, _, next ){

                // append sequence number
                parsers[rr].child.stdin.write( (seq++) + '\0' + chunk + '\n', next );

                // round-robin
                rr++; if( rr >= parsers.length ){ rr=0; }

              }, function flush( next ){

                // close all parser stdin's
                parsers.forEach( function( parser ){
                  parser.child.stdin.end();
                });
                next();
              }));
