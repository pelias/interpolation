
var through = require("through2"),
    split = require('../stream/split'),
    child_process = require("child_process"),
    codec = require("./codec");

var OPTIONS = {
  cwd: process.cwd(),
  env: process.ENV,
  stdio: ["pipe", "pipe", "pipe"/*, "ipc"*/]
};

var spawn = function(cmd, args, options){

  var child = child_process.spawn(cmd, args, options || OPTIONS);

  child.on( 'error', console.error.bind( console, 'child error' ) );
  child.stdin.on( 'error', console.error.bind( console, 'child stdin error' ) );
  child.stdout.on( 'error', console.error.bind( console, 'child stdout error' ) );
  child.stderr.on( 'error', console.error.bind( console, 'child stderr error' ) );

  var stream = through.obj( function( msg, enc, next ){
    child.stdin.write( codec.encode( msg ), next );
  }, function flush( next ){
    child.stdout.on('end', next);
    child.stdin.end();
  });

  var decoder = through.obj( function( chunk, _, next ){
    var data = codec.decode( chunk );
    if( chunk ){
      stream.push( chunk );
    }
    next();
  });

  stream.on( 'stream error', console.error.bind( console ) );
  decoder.on( 'decoder error', console.error.bind( console ) );

  // @todo: handle flow control
  child.stdout.pipe( split() )
              .pipe( decoder );

  // expose child
  stream.child = child;

  return stream;
};

module.exports.spawn = spawn;
