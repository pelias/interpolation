const Database = require('better-sqlite3');
const requireDir = require('require-dir');
const stream = requireDir('../stream', { recurse: true });
const query = requireDir('../query');

// export method
function vertices(addressDbPath, streetDbPath, done){

  // connect to db
  const db = new Database(addressDbPath, { unsafe: true });

  query.configure(db); // configure database
  query.tables.address(db); // create tables only if not already created
  db.exec(`ATTACH DATABASE '${streetDbPath}' as 'street'`);

  const sql = `SELECT * FROM street.polyline WHERE EXISTS (SELECT id FROM address WHERE id = polyline.id LIMIT 1)`;
  stream.each(db, sql)
          .pipe( stream.vertices.lookup( db ) )
          .pipe( stream.vertices.augment() )
          .pipe( stream.batch( 1000 ) ) // batch up data to import
          .pipe( stream.address.import( db, function(){

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
