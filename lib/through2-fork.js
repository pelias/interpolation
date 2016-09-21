
var through = require("through2"),
    child_process = require("child_process");

var OPTIONS = {
  cwd: process.cwd(),
  env: process.ENV,
  stdio: ["pipe", "pipe", "pipe"/*, "ipc"*/]
};

var fork = function( cmd, args ){

  var child = child_process.spawn(cmd, args, OPTIONS);
  child.on( 'error', console.error.bind( console ) );

  var stream = through( function( chunk, enc, next ){
    child.stdin.write( chunk, next );
  }, function flush( next ){
    child.stdout.on('end', next);
    child.stdin.end();
  });

  // @todo: handle flow control
  child.stdout.on('data', function( data ){
    stream.push( data );
  });

  // expose child
  stream.child = child;

  return stream;
};

module.exports = fork;
