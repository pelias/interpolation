
var through = require("through2"),
    child = require("child_process");

var OPTIONS = {
  cwd: process.cwd(),
  env: process.ENV,
  stdio: ["pipe", "pipe", "pipe"/*, "ipc"*/]
};

var fork = function( cmd, args ){

  var proc = child.spawn(cmd, args, OPTIONS);
  proc.on( 'error', console.error.bind( console ) );

  var stream = through( function( chunk, enc, next ){
    proc.stdin.write( chunk, next );
  }, function flush( next ){
    proc.stdout.on('end', function(){
      console.error( 'stdout end' );
      next();
    });
    proc.stdin.end();
  });

  stream.stdin = proc.stdin;
  stream.stdout = proc.stdout;
  stream.stderr = proc.stderr;
  // comb.on('error', console.error.bind(console, 'comb err'))
  // comb.on('end', console.error.bind(console, 'comb end'))


  // proc.stdout.pipe( output );
  proc.stdout.on('data', function( data ){
    stream.push( data );
  });

  // proc.stderr.pipe( through( function( chunk, enc, next ){
  //   console.error( "fork stderr", chunk.toString('utf8') );
  //   next();
  // }));


  return stream;
}

module.exports = fork;
