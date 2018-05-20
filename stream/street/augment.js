const util = require('util');
const _ = require('lodash');
const through = require('through2');
const analyze = require('../../lib/analyze');

// increase/decrease bbox bounds by this much in order to find houses which
// might be slighly outside the bounds.
// eg: http://geojson.io/#id=gist:anonymous/ce8b0cdd2ba83ef24cfaab49d36d8cdd&map=15/52.5011/13.3222
var FUDGE_FACTOR = 0.005;

const analyze_street = util.promisify(analyze.street);

/**
  this stream augments the parsed data with additional fields.

  actions:
   - perform libpostal normalization
   - apply 'fudge factor' to bbox
**/
let i = 0;
function streamFactory(){
  return through.obj(async function( street, enc, next ){

    // normalize all names
    await Promise.all(street.getNames().map( async (name) => {
      return await analyze_street( name );
    })).then(function(names) {
      // if the source file contains no valid names for this polyline
      if( !names.length ){
        console.error( 'street has no valid names, check your 0sv file:' );
        console.error( street.getEncodedPolyline() );
        return next();
      }

      try {
        // an extra level of arrays is added by Promise.all
        names = _.flatten(names);
        street.setNames( names );
      } catch (e) {
        console.error(e);
        console.error(`trying to set invalid name ${names}`);
      }

      // expand bbox
      var bbox = street.getBbox();
      street.setBbox({
        minX: bbox.minX -FUDGE_FACTOR,
        minY: bbox.minY -FUDGE_FACTOR,
        maxX: bbox.maxX +FUDGE_FACTOR,
        maxY: bbox.maxY +FUDGE_FACTOR
      });

      next(null, street);
    });
  });
}

module.exports = streamFactory;
