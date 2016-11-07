
var postal;

// constants for controlling how we parse ranges, eg: 'α-β'
// some ranges such as '1-7' are ambiguous; it could mean 'apt 7, no 1'; or
// it could mean 'apt 1, no 7'; or could even be a valid range 'one to seven'.
// note: these values provide a means of setting some sane defaults for which
// ranges we try to parse and which ones we leave.
var MIN_RANGE = 1; // the miniumum amount β is higher than α
var MAX_RANGE = 6; // the maximum amount β is higher than α
var MIN_RANGE_HOUSENUMBER = 10; // the minimum acceptible value for both α and β

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

  // still not a valid string?
  if( 'string' !== typeof num ){ return NaN; }

  // replace fractions, eg: '1/2' with british style character suffices.
  var number = num.replace(' 1/4', 'f').replace('¼', 'f')
                  .replace(' 1/2', 'm').replace('½', 'm')
                  .replace(' 3/4', 'u').replace('¾', 'u');

  // remove spaces from housenumber. eg: '2 A' -> '2A'
  number = number.replace(/\s+/g, '').toLowerCase();

  // remove forward slash or minus, but only if between a number and a letter.
  // eg: '2/a' or '2-a' -> '2a'
  if( number.match(/^[0-9]+[\/|-][a-z]$/) ){ number = number.replace(/\/|-/g, ''); }

  // remove forward slash when apartment number is null, eg: '9/-' -> '9'
  else if( number.match(/^[0-9]+\/-$/) ){ number = number.replace(/\/|-/g, ''); }

  // replace deciamal half with british sttle character suffix, eg: '9.5' -> '9-m'
  else if( number.match(/^[0-9]+\.5$/) ){ number = number.replace('.5', 'm'); }

  else {
    // split the components to attempt more advanced parsing
    var split = number.match(/^([0-9]+)([\/|-])([0-9]+)$/);
    if( split ){
      var house = split[1], delim = split[2], apt = split[3];

      // if the housenumber and apartment number are the same we can safely use either.
      // eg: '1/1' -> '1' or '31/31' -> '31'
      if( house === apt ){ number = house; }

      // handle small ranges, eg: '72-74' -> '73'
      else if( delim === '-' ){
        var start = parseInt( house, 10 ), end = parseInt( apt, 10 ), diff = end - start;

        // don't parse single digit ranges, things like '1-4' are ambiguous
        if( start < MIN_RANGE_HOUSENUMBER || end < MIN_RANGE_HOUSENUMBER ){ return NaN; }

        // ensure the range is within acceptible limits
        if( diff <= MAX_RANGE && diff > MIN_RANGE ){
          number = '' + Math.floor( start + ( diff / 2 ) );
        }
      }
    }
  }

  // a format we don't currently support
  // @see: https://github.com/pelias/interpolation/issues/16
  if( !number.match(/^[0-9]+[a-z]?$/) ){ return NaN; }

  // @note: removes letters such as '2a' -> 2
  var float = parseFloat( number );

  // zero house number
  if( float <= 0 ){ return NaN; }

  // if the house number is followed by a single letter [a-z] then we
  // add a fraction to the house number representing the offset.
  // eg: 1a -> 1.1
  var apartment = number.match(/^[0-9]+([a-z])$/);
  if( apartment ){
    var offset = apartment[1].charCodeAt(0) - 96; // gives a:1, b:2 etc..
    float += ( offset * 0.03 ); // add fraction to housenumber for apt;
  }

  return parseFloat( float.toFixed(2) ); // because floating point arithmetic
}

/**
  take the float housenumber produced by the function above and convert it back to
  an alphanumeric value.

  eg. 1.1 -> 1a
**/
function housenumberFloatToString( f ){
  if( 'number' !== typeof f ){ return ''; }

  var suffix = '';
  var fractional = Math.floor(( f % 1 ) * 100.1 /* add 0.1 to avoid floating point errors */ );
  if( fractional > 0 && fractional <= 78 ){
    suffix = String.fromCharCode( 96 + Math.round( fractional / 3 ));
  }

  return '' + Math.floor( f ) + suffix;
}

module.exports.street = street;
module.exports.housenumber = housenumber;
module.exports.housenumberFloatToString = housenumberFloatToString;
