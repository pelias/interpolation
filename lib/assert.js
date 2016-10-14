
/**
  a convenience error reporter for sql queries
**/

var assert = { transaction: {}, statement: {} };

assert.log = function( title ){
  return function( err ){
    if( err ){ console.error( 'sqlite3: ' + title + ': ' + err ); }
  };
};

assert.transaction.start = assert.log('BEGIN TRANSACTION');
assert.transaction.end = assert.log('END TRANSACTION');
assert.statement.names = assert.log('STATEMENT NAMES');
assert.statement.rtree = assert.log('STATEMENT RTREE');
assert.statement.lines = assert.log('STATEMENT LINES');
assert.statement.address = assert.log('STATEMENT ADDRESS');

module.exports = assert;
