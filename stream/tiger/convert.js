
var through = require('through2'),
    Address = require('../../lib/Address');

/**
  convert tiger data to a generic Address model

  see: http://www2.census.gov/geo/pdfs/maps-data/data/tiger/tgrshp2016/TGRSHP2016_TechDoc_Ch4.pdf
**/

// {
//   "type": "Feature",
//   "properties": {
//     "TLID": 610017339,
//     "TFIDL": 214010164,
//     "TFIDR": 225948291,
//     "ARIDL": "400460920152",
//     "ARIDR": "400460925467",
//     "LINEARID": "110460981641",
//     "FULLNAME": "Paladino Ave",
//     "LFROMHN": "5",
//     "LTOHN": "15",
//     "RFROMHN": "10",
//     "RTOHN": "32",
//     "ZIPL": "10035",
//     "ZIPR": "10035",
//     "EDGE_MTFCC": "S1400",
//     "ROAD_MTFCC": "S1400",
//     "PARITYL": "O",
//     "PARITYR": "E",
//     "PLUS4L": null,
//     "PLUS4R": null,
//     "LFROMTYP": "I",
//     "LTOTYP": "I",
//     "RFROMTYP": "I",
//     "RTOTYP": "I",
//     "OFFSETL": "N",
//     "OFFSETR": "N"
//   },
//   "geometry": {
//     "type": "LineString",
//     "coordinates": [
//       [
//         -73.93160199999998,
//         40.80054799999999
//       ],
//       [
//         -73.93051699999998,
//         40.800066
//       ],
//       [
//         -73.93044299999998,
//         40.80002199999999
//       ],
//       [
//         -73.93034999999999,
//         40.799945
//       ],
//       [
//         -73.93027999999998,
//         40.799863999999985
//       ]
//     ]
//   }
// }

function streamFactory(){
  return through.obj(function( tiger, _, next ){

    // invalid record
    if( !tiger || !tiger.hasOwnProperty('geometry') || !tiger.geometry.hasOwnProperty('coordinates') ){
      console.error( 'invalid tiger record', tiger );
      return next();
    }

    // find start and end coordinates for range
    var cLen = tiger.geometry.coordinates.length;
    var coords = {
      start: ( cLen > 0 ) ? tiger.geometry.coordinates[0] : null,
      end: ( cLen > 1 ) ? tiger.geometry.coordinates[ cLen-1 ] : null,
    };

    // start of road path
    if( coords.start ){

      // left side of the road
      if( tiger.properties.LFROMHN ){
        try {
          var lfromhm = new Address().setSource('TIGER');
          lfromhm.setStreet( tiger.properties.FULLNAME );
          lfromhm.setNumber( tiger.properties.LFROMHN );
          lfromhm.setCoord({ lon: coords.start[0], lat: coords.start[1] });
          if( tiger.properties.ZIPL ){
            lfromhm.setPostcode( tiger.properties.ZIPL );
          }
          if( tiger.properties.TFIDL ){
            lfromhm.setId( tiger.properties.TFIDL );
          }
          this.push( lfromhm );
        }
        catch( e ){
          console.error( 'invalid tiger LFROMHN', e );
          console.error( tiger );
        }
      }

      // right side of the road
      if( tiger.properties.RFROMHN ){
        try {
          var rfromhm = new Address().setSource('TIGER');
          rfromhm.setStreet( tiger.properties.FULLNAME );
          rfromhm.setNumber( tiger.properties.RFROMHN );
          rfromhm.setCoord({ lon: coords.start[0], lat: coords.start[1] });
          if( tiger.properties.ZIPR ){
            rfromhm.setPostcode( tiger.properties.ZIPR );
          }
          if( tiger.properties.TFIDR ){
            rfromhm.setId( tiger.properties.TFIDR );
          }
          this.push( rfromhm );
        }
        catch( e ){
          console.error( 'invalid tiger RFROMHN', e );
          console.error( tiger );
        }
      }
    }

    // end of road path
    if( coords.end ){

      // left side of the road
      if( tiger.properties.LTOHN ){
        try {
          var ltohm = new Address().setSource('TIGER');
          ltohm.setStreet( tiger.properties.FULLNAME );
          ltohm.setNumber( tiger.properties.LTOHN );
          ltohm.setCoord({ lon: coords.end[0], lat: coords.end[1] });
          if( tiger.properties.ZIPL ){
            ltohm.setPostcode( tiger.properties.ZIPL );
          }
          if( tiger.properties.TFIDL ){
            ltohm.setId( tiger.properties.TFIDL );
          }
          this.push( ltohm );
        }
        catch( e ){
          console.error( 'invalid tiger LTOHN', e );
          console.error( tiger );
        }
      }

      // right side of the road
      if( tiger.properties.RTOHN ){
        try {
          var rtohm = new Address().setSource('TIGER');
          rtohm.setStreet( tiger.properties.FULLNAME );
          rtohm.setNumber( tiger.properties.RTOHN );
          rtohm.setCoord({ lon: coords.end[0], lat: coords.end[1] });
          if( tiger.properties.ZIPR ){
            rtohm.setPostcode( tiger.properties.ZIPR );
          }
          if( tiger.properties.TFIDR ){
            rtohm.setId( tiger.properties.TFIDR );
          }
          this.push( rtohm );
        }
        catch( e ){
          console.error( 'invalid tiger RTOHN', e );
          console.error( tiger );
        }
      }
    }

    next();
  });
}

module.exports = streamFactory;
