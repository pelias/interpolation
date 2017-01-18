
var through = require('through2');

function streamFactory(){

  var buffer = [];

  return through.obj(function( chunk, _, next ){

    // buffer the whole file
    buffer.push( chunk.toString('utf8') );
    next();

  }, function flush( done ){

    try {

      // parse json
      var collection = JSON.parse( buffer.join('') );

      // push each feature downstream
      collection.features.forEach( function( feat ){
        this.push( feat );
      }, this);

    } catch( e ){
      console.error( 'invalid json', e );
      console.error( buffer );
      process.exit(1);
    }

    done();
  });
}

module.exports = streamFactory;
