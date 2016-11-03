
var through = require('through2');

/**
  convert openstreetmap data to the openaddresses format so we can reuse all
  the openaddresses code.
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

// { LON: '174.5805754',
//   LAT: '-36.1037843',
//   NUMBER: '30A',
//   STREET: 'Thelma Road South',
//   UNIT: '',
//   CITY: 'Mangawhai Heads',
//   DISTRICT: '',
//   REGION: 'Kaipara District',
//   POSTCODE: '',
//   ID: '1939485',
//   HASH: '' }

function streamFactory(){
  return through.obj(function( json, _, next ){

    this.push({
      _SRC: 'OSM',
      LON: json.hasOwnProperty('centroid') ? json.centroid.lon : json.lon,
      LAT: json.hasOwnProperty('centroid') ? json.centroid.lat : json.lat,
      NUMBER: json.tags['addr:housenumber'] || '',
      STREET: json.tags['addr:street'] || '',
      UNIT: json.tags['addr:unit'] || '',
      CITY: json.tags['addr:city'] || '',
      DISTRICT: json.tags['addr:district'] || '',
      REGION: json.tags['addr:province'] || json.tags['addr:region'] || '',
      POSTCODE: json.tags['addr:postcode'] || '',
      ID: json.id,
      HASH: String( json.id )
    });

    next();
  });
}

module.exports = streamFactory;
