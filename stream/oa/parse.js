
var parser = require('csv-parse');

var CSV_OPTIONS = {
  trim: true,
  skip_empty_lines: true,
  relax_column_count: true,
  relax: true,
  columns: true
};

// csv parser configured for openaddresses data
module.exports = function(){
  var stream = parser(CSV_OPTIONS);
  stream.on( 'error', function( e ){
    console.error( 'csv parse error', e );
  });
  return stream;
};
