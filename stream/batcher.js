
var batchify = require('through2-batch');

var BATCH_OPTIONS = { batchSize: 1000 };

function streamFactory(){
  return batchify.obj(BATCH_OPTIONS, function( batch, _, next ){
    if( !batch.length ){
      return next();
    }
    this.push( batch );
    next();
  });
}

module.exports = streamFactory;
