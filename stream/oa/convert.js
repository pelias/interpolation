
var through = require('through2'),
    Address = require('../../lib/Address');

/**
  convert openaddresses data to a generic Address model
**/

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

  var autoincrement = 0;

  return through.obj(function( csv, _, next ){

    var address = new Address().setSource('OA');

    /*
      mandatory properties
    */

    try {
      // see: https://github.com/pelias/pelias/issues/487
      address.setId( csv.HASH || ++autoincrement );

      address.setStreet( csv.STREET );
      address.setNumber( csv.NUMBER );
      address.setCoord({ lon: csv.LON, lat: csv.LAT });
    }
    catch( e ){
      console.error( 'invalid csv row', e );
      console.error( csv );
      return next();
    }

    /*
      optional properties
    */

    try { address.setUnit( csv.UNIT ); }
    catch( e ){ /* ignore error */ }

    try { address.setCity( csv.CITY ); }
    catch( e ){ /* ignore error */ }

    try { address.setDistrict( csv.DISTRICT ); }
    catch( e ){ /* ignore error */ }

    try { address.setRegion( csv.REGION ); }
    catch( e ){ /* ignore error */ }

    try { address.setPostcode( csv.POSTCODE ); }
    catch( e ){ /* ignore error */ }

    // valid address; push downstream
    this.push( address );
    next();
  });
}

module.exports = streamFactory;
