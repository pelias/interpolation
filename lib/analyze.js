
var postal;

function analyze( streetName ){

  // lazy load this dependency; since it's large (~2GB RAM) and may be
  // accidentally required by a process which doesn't use it.
  if( !postal ){
    console.error('load libpostal');
    postal = require('node-postal');
  }

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

module.exports = analyze;
