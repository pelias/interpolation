
var Address = function(){
  this.id = null;
  this.source = null;
  this.coords = {};
  this.number = null;
  this.street = null;
  this.unit = null;
  this.city = null;
  this.district = null;
  this.region = null;
  this.postcode = null;
};

// id
Address.prototype.getId = function(){ return this.id; };
Address.prototype.setId = function( id ){
  if( !id || !( 'string' === typeof id || 'number' === typeof id ) ){
    throw new Error( 'invalid id' );
  }
  this.id = String(id); // coerse to string
  return this;
};

// source
Address.prototype.getSource = function(){ return this.source; };
Address.prototype.setSource = function( source ){
  if( 'string' !== typeof source || !source.length ){
    throw new Error( 'invalid source' );
  }
  this.source = source;
  return this;
};

// coord
Address.prototype.getCoord = function( type ){ return this.coords[type] || this.coords.default; };
Address.prototype.setCoord = function( coord, type ){

  // invalid object
  if( 'object' !== typeof coord || null === coord || !coord.hasOwnProperty('lat') || !coord.hasOwnProperty('lon') ){
    throw new Error( 'invalid coord' );
  }

  // parse floats
  coord.lat = parseFloat( coord.lat );
  coord.lon = parseFloat( coord.lon );

  // ensure the floats are valid
  if( isNaN( coord.lat ) ){ throw new Error( 'invalid lat' ); }
  if( isNaN( coord.lon ) ){ throw new Error( 'invalid lon' ); }

  this.coords[ type || 'default' ] = coord;

  return this;
};

// number
Address.prototype.getNumber = function(){ return this.number; };
Address.prototype.setNumber = function( number ){
  if( 'string' !== typeof number || !number.length || number === '0' ){
    throw new Error( 'invalid house number' );
  }
  this.number = number;
  return this;
};

// street
Address.prototype.getStreet = function(){ return this.street; };
Address.prototype.setStreet = function( street ){
  if( 'string' !== typeof street || !street.length ){
    throw new Error( 'invalid street' );
  }
  this.street = street;
  return this;
};

// unit
Address.prototype.getUnit = function(){ return this.unit; };
Address.prototype.setUnit = function( unit ){
  if( 'string' !== typeof unit || !unit.length ){
    throw new Error( 'invalid unit' );
  }
  this.unit = unit;
  return this;
};

// city
Address.prototype.getCity = function(){ return this.city; };
Address.prototype.setCity = function( city ){
  if( 'string' !== typeof city || !city.length ){
    throw new Error( 'invalid city' );
  }
  this.city = city;
  return this;
};

// district
Address.prototype.getDistrict = function(){ return this.district; };
Address.prototype.setDistrict = function( district ){
  if( 'string' !== typeof district || !district.length ){
    throw new Error( 'invalid district' );
  }
  this.district = district;
  return this;
};

// region
Address.prototype.getRegion = function(){ return this.region; };
Address.prototype.setRegion = function( region ){
  if( 'string' !== typeof region || !region.length ){
    throw new Error( 'invalid region' );
  }
  this.region = region;
  return this;
};

// postcode
Address.prototype.getPostcode = function(){ return this.postcode; };
Address.prototype.setPostcode = function( postcode ){
  if( 'string' !== typeof postcode || !postcode.length ){
    throw new Error( 'invalid postcode' );
  }
  this.postcode = postcode;
  return this;
};

// use the validators to confirm all mandatory properties are set correctly
Address.prototype.isValid = function(){
  var test = new Address();
  try {
    test.setSource( this.getSource() );
    test.setNumber( this.getNumber() );
    test.setStreet( this.getStreet() );
    test.setCoord( this.getCoord() );
  }
  catch( e ){ return false; }
  return true;
};

module.exports = Address;
