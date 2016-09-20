
var through = require('through2');

function deserializeFactory(){
  return through.obj( function( chunk, _, next ){
    if( chunk.length ){
      if( Buffer.isBuffer( chunk ) ){
        chunk = chunk.toString('utf8');
      }
      this.push( JSON.parse( chunk ) );
    }
    next();
 });
}

function serializeFactory(){
  return through.obj( function( chunk, enc, next ){
    this.push( JSON.stringify( chunk ) + '\n' );
    next();
  });
}

module.exports.serialize = serializeFactory;
module.exports.deserialize = deserializeFactory;
