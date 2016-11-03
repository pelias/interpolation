
var through = require('through2');

// combine addresses from the same street in to a single batch.

/* street
  { id: 300, line: 'crlzzA{p~`QqB_BoIA' }
  { id: 301, line: 'yhh_{Aag{pPkL|`@aHxi@??_Dha@' }
*/

function streamFactory( db ){

  // create prepared statement
  var stmt = db.prepare( 'SELECT * FROM address WHERE source != "VERTEX" AND id = ? ORDER BY housenumber ASC' );

  return through.obj( function( street, _, next ){

    // select all addresses which correspond to street.id (excluding existing vertices)
    stmt.all([ street.id ], function( err, addresses ){

      // an error occurred
      if( err ){ console.error( err ); }

      // push street and addresses downstream
      else if( addresses && addresses.length ){
        this.push({
          street: street,
          addresses: addresses
        });
      }

      // continue
      next();

    }.bind(this) );

  }, function flush( next ){
    stmt.finalize(); // finalize prepared statement
    next();
  });
}

module.exports = streamFactory;
