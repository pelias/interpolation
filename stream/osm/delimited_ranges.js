
var through = require('through2');

// valid delimiters
var DELIMITER_REGEX = /[,;]/;

function streamFactory(){
  return through.obj( function( json, _, next ){

    // no-op, this record doesn't contain a delimited list of house numbers
    if( !json.tags || !json.tags.hasOwnProperty('addr:housenumber') || !json.tags['addr:housenumber'].match( DELIMITER_REGEX ) ){
      this.push( json );
      return next();
    }

    // split delimited list in to array of members
    var housenumbers = json.tags['addr:housenumber'].split( DELIMITER_REGEX );

    // remove empty members
    housenumbers = housenumbers.filter( function( e ){ return e; });

    // deduplicate array
    housenumbers = housenumbers.filter( function( value, index, array ) {
      return array.indexOf( value ) === index;
    });

    // iterate over housenumbers in list
    housenumbers.forEach( function( num ){

      // create a copy with the house number changed
      var copy = JSON.parse( JSON.stringify( json ) );
      copy.tags['addr:housenumber'] = num.trim();

      // push each copy downstream
      this.push( copy );

    }, this);

    // more
    next();

  });
}

module.exports = streamFactory;
