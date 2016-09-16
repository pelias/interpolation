
var through = require('through2');

function streamFactory(db, done){

  // vanity statistics
  var total_saved = 0;

  var statement = {
    // rtree: db.prepare("INSERT INTO street_rtree (id, minX, maxX, minY, maxY) VALUES ($id, $minX, $maxX, $minY, $maxY);"),
    names: db.prepare("INSERT INTO street_names (rowid, id, name) VALUES (NULL, $id, $name);"),
    line: db.prepare("INSERT INTO street_polyline (id, line, minX, maxX, minY, maxY) VALUES ($id, $line, $minX, $maxX, $minY, $maxY);"),
    // geometry: db.prepare("INSERT INTO street_geometry (id, geometry) VALUES ($id, LineStringFromText($geom, 4326));")
  };

  return through.obj(function( batch, _, next ){

    total_saved += batch.length;
    console.error( total_saved );

    db.serialize(function() {
      db.run("BEGIN", onError('BEGIN'));
      db.parallelize(function(){

        batch.forEach( function( parsed ){

          // insert bbox in to rtree
          // statement.rtree.run({
          // // db.run("INSERT INTO street_rtree (id, minX, maxX, minY, maxY) VALUES ($id, $minX, $maxX, $minY, $maxY);", {
          //   $id:   parsed.id,
          //   $minX: parsed.minX,
          //   $maxX: parsed.maxX,
          //   $minY: parsed.minY,
          //   $maxY: parsed.maxY
          // }, onError('rtree'));

          // insert names in to lookup table
          parsed.names.forEach( function( name ){
            statement.names.run({
            // db.run("INSERT INTO street_names (rowid, id, name) VALUES (NULL, $id, $name);", {
              $id:   parsed.id,
              $name: name
            }, onError('names'));
          });

          // insert line in to polyline table
          statement.line.run({
          // db.run("INSERT INTO street_polyline (id, line) VALUES ($id, $line);", {
            $id:   parsed.id,
            $line: parsed.line,
            $minX: parsed.minX,
            $maxX: parsed.maxX,
            $minY: parsed.minY,
            $maxY: parsed.maxY
          }, onError('line'));

          // insert geom in to geometry table
          // statement.geometry.run({
          //   $id:   parsed.id,
          //   $geom: parsed.geom
          // }, onError('geometry'));
        });
      }); // parallelize
      db.run("COMMIT", onError('COMMIT'));
      next();
    });
  }, function(){

    // statement.rtree.finalize();
    statement.names.finalize();
    statement.line.finalize();
    // statement.geometry.finalize();

    // insert in to rtree
    db.run("INSERT INTO street_rtree (id, minX, maxX, minY, maxY) SELECT id, minX, maxX, minY, maxY FROM street_polyline;", function(){

      // we are done
      done();
    });

  });
}

function onError( title ){
  return function( err ){
    if( err ){
      console.error( "stmt " + title + ": " + err );
    }
  };
}

module.exports = streamFactory;
