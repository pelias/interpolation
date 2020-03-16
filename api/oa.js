const Database = require('better-sqlite3');
const requireDir = require('require-dir');
const stream = requireDir('../stream', { recurse: true });
const query = requireDir('../query');

// export method
function oa(dataStream, addressDbPath, streetDbPath, done){

  // connect to db
  const db = new Database(addressDbPath);

  query.configure(db); // configure database
  query.tables.address(db); // create tables only if not already created
  db.exec(`ATTACH DATABASE '${streetDbPath}' as 'street'`);

  dataStream
    .pipe( stream.oa.parse() ) // parse openaddresses csv data
    .pipe( stream.oa.convert() ) // convert openaddresses data to generic model
    .pipe( stream.address.batch() ) // batch records on the same street
    .pipe( stream.address.lookup( db ) ) // look up from db
    .pipe( stream.address.augment() ) // perform interpolation
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

module.exports = oa;
