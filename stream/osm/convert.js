
var util = require('util'),
    through = require('through2'),
    Address = require('../../lib/Address');

/**
  convert openstreetmap data to a generic Address model.
**/

// { "id":2549960777,
//   "type":"node",
//   "lat":40.7450163,
//   "lon":-73.9916791,
//   "tags":{
//     "addr:housenumber":"101",
//     "addr:postcode":"10001",
//     "addr:street":"West 26th Street"
//    }}

function streamFactory(){
  return through.obj(function( json, _, next ){

    var address = new Address().setSource('OSM');

    /*
      mandatory properties
    */

    try {
      address.setId( util.format( '%s:%s', json.type, json.id ) );
      address.setStreet( json.tags['addr:street'] );
      address.setNumber( json.tags['addr:housenumber'] );
      address.setCoord({
        lon: json.hasOwnProperty('centroid') ? json.centroid.lon : json.lon,
        lat: json.hasOwnProperty('centroid') ? json.centroid.lat : json.lat
      });
    }
    catch( e ){
      console.error( 'invalid json', e );
      console.error( json );
      return next();
    }

    /*
      optional properties
    */

    try { address.setUnit( json.tags['addr:unit'] ); }
    catch( e ){ /* ignore error */ }

    try { address.setCity( json.tags['addr:city'] ); }
    catch( e ){ /* ignore error */ }

    try { address.setDistrict( json.tags['addr:district'] ); }
    catch( e ){ /* ignore error */ }

    try { address.setRegion( json.tags['addr:province'] || json.tags['addr:region'] ); }
    catch( e ){ /* ignore error */ }

    try { address.setPostcode( json.tags['addr:postcode'] ); }
    catch( e ){ /* ignore error */ }

    // valid address; push downstream
    this.push( address );
    next();
  });
}

module.exports = streamFactory;
