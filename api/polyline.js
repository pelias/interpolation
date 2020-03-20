const Database = require('better-sqlite3');
const requireDir = require('require-dir');
const stream = requireDir('../stream', { recurse: true });
const query = requireDir('../query');

// export method
function polyline(dataStream, streetDbPath, done){

  // connect to db
  const db = new Database(streetDbPath);

  query.configure(db); // configure database
  query.tables.street(db, true); // reset database and create tables

  // run pipeline
  dataStream
    .pipe( stream.split() ) // split on newline
    .pipe( stream.polyline.autoincrement() ) // prepend line numbers
    .pipe( stream.polyline.parse() ) // parse polyline data
    .pipe( stream.street.augment() ) // augment data with libpostal
    .pipe( stream.batch( 1000 ) ) // batch up data to import
    .pipe( stream.street.import( db, function(){

      // create the indexes after the data is imported
      // for performance reasons.
      query.indexes.street(db, function(){

        // close the db handle when done
        db.close();

        // done
        if( 'function' === typeof done ){ done(); }

      });
    })); // save to db
}

module.exports = polyline;
