
var batchify = require('through2-batch');

/**
  generic stream batcher.

  this simply batches up $size rows in to a single array
  and then pushes that array downstream.
**/
function streamFactory( size ){
  size = size || 100;
  return batchify.obj({ batchSize: size, highWaterMark: 2 }, function( batch, _, next ){
    this.push( batch );
    next();
  });
}

module.exports = streamFactory;
