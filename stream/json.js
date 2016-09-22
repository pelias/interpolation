
var through = require('through2'),
    codec = require('../lib/codec');

function deserializeFactory(){
  return through.obj( function( chunk, _, next ){
    var msg = codec.decode( chunk );
    if( msg ){
      this.push( msg );
    }
    next();
 });
}

function serializeFactory(){
  return through.obj( function( chunk, enc, next ){
    this.push( codec.encode( chunk ) );
    next();
  });
}

module.exports.serialize = serializeFactory;
module.exports.deserialize = deserializeFactory;
