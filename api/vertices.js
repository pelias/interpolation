
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    stream = requireDir('../stream', { recurse: true }),
    query = requireDir('../query');

// export method
function vertices(addressDbPath, streetDbPath, done){

  // connect to db
  sqlite3.verbose();
  var db = new sqlite3.Database( process.argv[2] );

  query.configure(db); // configure database
  query.tables.address(db); // create tables only if not already created
  query.attach(db, process.argv[3], 'street'); // attach street database

  var sql = [
    'SELECT * FROM street.polyline',
    'JOIN address ON street.polyline.id = address.id',
    'WHERE address.source != "VERTEX"',
    'ORDER BY address.id ASC, address.housenumber ASC'
  ].join(' ');

  var dbStream = stream.query( db, sql );

  dbStream.pipe( stream.vertices.batch() )
          .pipe( stream.vertices.augment() )
          .pipe( stream.batch( 1000 ) ) // batch up data to import
          .pipe( stream.oa.import( db, function(){

            // create the indexes after the data is imported
            // for performance reasons.
            query.indexes.address(db, function(){

              // close the db handle when done
              db.close();

              // done
              if( 'function' === typeof done ){ done(); }

            });

          })); // save to db
}

module.exports = vertices;
