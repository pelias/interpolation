
var polyline = require('@mapbox/polyline');

var Street = function(){
  this.id = null;
  this.names = [];
  this.bbox = null;
  this.encoded = null;
  this.decoded = null;
  this.precision = null;
};

// id
Street.prototype.getId = function(){ return this.id; };
Street.prototype.setId = function( id ){
  if( !id ){ throw new Error( 'invalid id' ); }
  this.id = id;
  return this;
};

// names
Street.prototype.getNames = function(){ return this.names; };
Street.prototype.setNames = function( names ){
  if( !Array.isArray( names ) || !names.length ){ throw new Error( 'invalid names array' ); }
  this.names = names.map( function( name ){
    if( 'string' !== typeof name ){ throw new Error( 'invalid name string' ); }
    return name.trim();
  });
  return this;
};

// bbox
Street.prototype.getBbox = function(){
  if( !this.bbox && ( this.decoded || this.encoded ) ){ // lazy compute bbox
    var bbox = Street.bboxify( this.getDecodedPolyline() );
    this.bbox = { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3] };
  }
  return this.bbox;
};
Street.prototype.setBbox = function( bbox ){
  // @todo: check property names minX, minY, maxX, maxY
  if( 'object' !== typeof bbox || null === bbox || Object.keys(bbox).length !== 4 ){ throw new Error( 'invalid bbox object' ); }
  this.bbox = bbox;
  return this;
};

// encoded
Street.prototype.getEncodedPolyline = function(){
  if( !this.encoded && this.decoded ){ this.encoded = polyline.encode( this.getDecodedPolyline(), this.precision ); } // lazy encoding
  return this.encoded;
};
Street.prototype.setEncodedPolyline = function( encoded, precision ){
  if( 'string' !== typeof encoded || !encoded.length ){ throw new Error( 'invalid polyline' ); }
  if( 'number' === typeof precision && precision ){
    this.precision = precision;
  }
  this.encoded = encoded;
  return this;
};

// decoded
Street.prototype.getDecodedPolyline = function(){
  if( !this.decoded && this.encoded ){ this.decoded = polyline.decode( this.getEncodedPolyline(), this.precision ); } // lazy decoding
  return this.decoded;
};
Street.prototype.setDecodedPolyline = function( decoded ){
  if( !Array.isArray( decoded ) || !decoded.length ){ throw new Error( 'invalid coordinates' ); }
  this.decoded = decoded;
  return this;
};

/*
  compute bbox.
  note: same format as 'geojson-extent' without format shifting to geojson first.
*/
Street.bboxify = function( coords ){

  // compute coordinate extremes
  var minLat = Infinity; var maxLat = -Infinity;
  var minLng = Infinity; var maxLng = -Infinity;

  coords.forEach( function( coord ){

    // latitude
    if( coord[0] > maxLat ){
      maxLat = coord[0];
    }
    if( coord[0] < minLat ){
      minLat = coord[0];
    }

    // longitude
    if( coord[1] > maxLng ){
      maxLng = coord[1];
    }
    if( coord[1] < minLng ){
      minLng = coord[1];
    }
  });

  return [ minLng, minLat, maxLng, maxLat ]; // [WSEN]
};

module.exports = Street;
