
var through = require('through2');

var DELIM = '\0';
var EOL = '\n';

function streamFactory(){
  var seq = 1; // start sequence at 1

  return through.obj( function( chunk, _, next ){
    this.push( seq + DELIM + chunk + EOL );
    seq++; // increment
    next();
  });
}

module.exports = streamFactory;
