
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
    return item.replace( /(([0-9]+)(st|nd|rd|th)($|\s))/gi, "$2 " ).trim();
  });

  // remove duplicates
  expansions = expansions.filter(function(item, pos, self) {
    return self.indexOf(item) == pos;
  });

  return expansions;
}

/**
  analyze input housenumber string and return a float representing it's value.
**/
function housenumber( num ){

  // remove spaces from housenumber. eg: '2 A' -> '2A'
  var number = num.replace(/\s+/g, '').toLowerCase();

  // @note: removes letters such as '2a' -> 2
  var float = parseFloat( number );

  // if the house number is followed by a single letter [a-i] then we
  // add a fraction to the house number representing the offset.
  // @todo: tests for this
  var apartment = number.match(/^[0-9]+([abcdefghi])$/);
  if( apartment ){
    var offset = apartment[1].charCodeAt(0) - 96; // gives a:1, b:2 etc..
    float += ( offset / 10 ); // add fraction to housenumber for apt;
  }

  return float;
}

module.exports.street = street;
module.exports.housenumber = housenumber;
