
var through = require('through2');

// combine addresses from the same street in to a single batch.

/* street
  { id: 300, line: 'crlzzA{p~`QqB_BoIA' }
  { id: 301, line: 'yhh_{Aag{pPkL|`@aHxi@??_Dha@' }
*/

function streamFactory( db ){

  // create prepared statement
  var stmt = db.prepare( `SELECT * FROM address WHERE source != 'VERTEX' AND id = $id ORDER BY housenumber ASC` );

  return through.obj( function( street, _, next ){

    try {
      // select all addresses which correspond to street.id (excluding existing vertices)
      const addresses = stmt.all({ id: street.id });

      // push street and addresses downstream
      if( addresses && addresses.length ){
        this.push({
          street: street,
          addresses: addresses
        });
      }

      // continue
      next();
    } catch(err){
      // an error occurred
      console.error(err);
      next();
    }

  });
}

module.exports = streamFactory;
