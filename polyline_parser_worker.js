
var requireDir = require('require-dir'),
    stream = requireDir('./stream', { recurse: true });

// run pipeline
process.stdin
  .pipe( stream.split() ) // split on newline
  .pipe( stream.polyline.parse() ) // parse polyline data
  .pipe( stream.polyline.augment() ) // augment data with libpostal
  .pipe( stream.json.serialize() )
  .pipe( process.stdout );
