
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
  return parser(CSV_OPTIONS);
};
