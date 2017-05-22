
var through = require('through2'),
    polyline = require('@mapbox/polyline'),
    query = { near: require('../../query/near') },
    project = require('../../lib/project'),
    proximity = require('../../lib/proximity');

// polyline precision
var PRECISION = 6;

// maximum valid distance (in degrees) between a point and it's street projection.
// increasing this will result in more invalid matches, decresing will cause houses
// which lie a long distance from the road to no longer match correctly.
var MAX_DISTANCE = 0.0002;

function streamFactory( db ){
  return through.obj( function( json, _, next ){

    // no-op, the record already has an street name defined
    if( json.tags.hasOwnProperty('addr:street') ){
      this.push( json );
      return next();
    }

    // attempt to find the street name for records which are missing it

    // get point data
    var lon = json.hasOwnProperty('centroid') ? json.centroid.lon : json.lon;
    var lat = json.hasOwnProperty('centroid') ? json.centroid.lat : json.lat;

    // find all streets near the point
    query.near( db, { lon: lon, lat: lat }, function( err, streets ){

      // we didn't find any streets nearby; skip this record
      if( err || !streets || !streets.length ){
        console.error( 'couldn\'t find any nearby streets for', json );
        return next();
      }

      // decode polylines
      streets.forEach( function( street, i ){
        street.coordinates = project.dedupe( polyline.toGeoJSON(street.line, PRECISION).coordinates );
      });

      // order streets by proximity from point (by projecting it on to each line string)
      var ordered = proximity.nearest.street( streets, [ lon, lat ] );

      // an error occurred
      if( !ordered || !ordered.length ){
        console.error( 'unable to find nearest street for point' );
        console.error( 'streets', streets );
        console.error( 'address', json );
        return next();
      }

      // road is too far away to use
      if( ordered[0].proj.dist > MAX_DISTANCE ){
        console.error( 'nearest projection more than max distance from point' );
        return next();
      }

      // second road is also very close; ambiguous match; skip
      if( ordered.length > 1 && ordered[1].proj.dist <= MAX_DISTANCE ){
        console.error( 'ambiguous projection; more than one street match' );
        return next();
      }

      console.log( 'found a street name!', ordered[0].street.name );

      // use the nearest street
      json.tags['addr:street'] = ordered[0].street.name;
      this.push( json );
      next();

    }.bind(this));
  }, function flush(next){
    query.near.finalize();
    next();
  });
}

module.exports = streamFactory;
