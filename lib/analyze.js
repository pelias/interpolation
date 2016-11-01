
var postal;

/**
  analyze input streetname string and return a list of expansions.
**/
function street( streetName ){

  // lazy load this dependency; since it's large (~2GB RAM) and may be
  // accidentally required by a process which doesn't use it.
  if( !postal ){ postal = require('node-postal'); }

  // use libpostal to expand the address
  var expansions = postal.expand.expand_address( streetName );

  // remove ordinals
  expansions = expansions.map(function( item ){
    return item.replace( /(([0-9]+)(st|nd|rd|th)($|\s))/gi, '$2 ' ).trim();
  });

  // remove duplicates
  expansions = expansions.filter(function(item, pos, self) {
    return self.indexOf(item) === pos;
  });

  return expansions;
}

/**
  analyze input housenumber string and return a float representing it's value.
**/
function housenumber( num ){

  // num should be a string; if not, cast it to a string
  if( 'number' === typeof num ){ num = num.toString(10); }

  // remove spaces from housenumber. eg: '2 A' -> '2A'
  var number = num.replace(/\s+/g, '').toLowerCase();

  // remove forward slash or minus, but only if between a number and a letter.
  // eg: '2/a' or '2-a' -> '2a'
  if( number.match(/^[0-9]+[\/|-][a-i]$/) ){ number = number.replace(/\/|-/g, ''); }

  // remove forward slash when apartment number is null, eg: '9/-' -> '9'
  if( number.match(/^[0-9]+\/-$/) ){ number = number.replace(/\/|-/g, ''); }

  // a format we don't currently support
  // @see: https://github.com/pelias/interpolation/issues/16
  if( !number.match(/^[0-9]+[a-i]?$/) ){ return NaN; }

  // @note: removes letters such as '2a' -> 2
  var float = parseFloat( number );

  // if the house number is followed by a single letter [a-i] then we
  // add a fraction to the house number representing the offset.
  // eg: 1a -> 1.1
  var apartment = number.match(/^[0-9]+([abcdefghi])$/);
  if( apartment ){
    var offset = apartment[1].charCodeAt(0) - 96; // gives a:1, b:2 etc..
    float += ( offset / 10 ); // add fraction to housenumber for apt;
  }

  return float;
}

/**
  take the float housenumber produced by the function above and convert it back to
  an alphanumeric value.

  eg. 1.1 -> 1a
**/
function housenumberFloatToString( f ){
  if( 'number' !== typeof f ){ return ''; }

  var suffix = '';
  var fractional = Math.floor(( f % 1 ) * 10.1 /* add 0.1 to avoid floating point errors */ );
  if( fractional > 0 && fractional < 10 ){
    suffix = String.fromCharCode( 96 + fractional );
  }

  return '' + Math.floor( f ) + suffix;
}

module.exports.street = street;
module.exports.housenumber = housenumber;
module.exports.housenumberFloatToString = housenumberFloatToString;
