
var sqlite3 = require('sqlite3'),
    requireDir = require('require-dir'),
    stream = requireDir('./stream', { recurse: true }),
    query = requireDir('./query');

// name of sqlite file
var dbfile = ( process.argv.length > 2 ) ? process.argv[2] : 'example.db';

// connect to db
sqlite3.verbose();
var db = new sqlite3.Database(dbfile);

function main(){
  query.configure(db); // configure database
  query.createTables(db, true); // reset database and create tables

  var b = stream.batch( 1000 );

  // run pipeline
  var s = stream.polyline.import( db, function(){

    // create the indexes after the data is imported
    // for performance reasons.
    query.createIndexes(db, function(){

      // close the db handle when done
      db.close();

    });
  }); // save to db

  b.pipe(s);

  // ipc message
  process.on('message', function( msg ){
    if( msg === 'DONE' ){
      b.end();
      process.disconnect();
      return;
    }
    b.write( msg );
  });

  // ipc disco
  // process.on('close', function( msg ){
  //   console.error('close');
  //   b.end();
  // });
}

main();
