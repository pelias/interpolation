
var through = require('through2');

/**
  generic query stream.

  performs an arbitrary sql query and streams the results.
**/
function streamFactory( db, sql ){

  var stream = through.obj();

  db.each( sql, function( err, row ){

    // error handling
    if( err ){
      return console.error( err );
    }

    // push row on to stream
    stream.push( row );

  }, function flush(){

    // EOF
    stream.end();
  });

  return stream;
}

module.exports = streamFactory;
