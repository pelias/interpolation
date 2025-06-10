const through = require('through2');
const analyze = require('../../lib/analyze');
const asyncForEach = require('../../lib/asyncForEach');

// increase/decrease bbox bounds by this much in order to find houses which
// might be slighly outside the bounds.
// eg: http://geojson.io/#id=gist:anonymous/ce8b0cdd2ba83ef24cfaab49d36d8cdd&map=15/52.5011/13.3222
const FUDGE_FACTOR = 0.005;

/**
  this stream augments the parsed data with additional fields.

  actions:
   - perform libpostal normalization
   - apply 'fudge factor' to bbox
**/

// the transform function is executed once per batch in the stream.
const transform = async (street, _, next) => {

  // normalize all names
  let names = [];
  await asyncForEach(street.getNames(), async (name) => {
    names = names.concat(await analyze.street(name));
  });

  // if the source file contains no valid names for this polyline
  if (!names.length) {
    console.error('street has no valid names, check your 0sv file:');
    console.error(street.getEncodedPolyline());
    return next();
  }

  street.setNames(names);

  // expand bbox
  const bbox = street.getBbox();
  street.setBbox({
    minX: bbox.minX - FUDGE_FACTOR,
    minY: bbox.minY - FUDGE_FACTOR,
    maxX: bbox.maxX + FUDGE_FACTOR,
    maxY: bbox.maxY + FUDGE_FACTOR
  });

  // push augmented data downstream
  next(null, street);
};

// export a function which returns a new stream
module.exports = () => through.obj(transform);
