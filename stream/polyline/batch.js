
var batchify = require('through2-batch');

var BATCH_OPTIONS = { batchSize: 1000 };

/**
  generic stream batcher.

  this simply batches up $batchSize rows in to a single array
  and then pushes that array downstream.
**/
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
