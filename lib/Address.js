
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
  if( !id ){ throw new Error( 'invalid id' ); }
  this.id = id;
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
  if( !coord || 'number' !== typeof coord.lat || 'number' !== typeof coord.lon ){
    throw new Error( 'invalid point' );
  }
  this.coords[ type || 'default' ] = coord;
  return this;
};

// number
Address.prototype.getNumber = function(){ return this.number; };
Address.prototype.setNumber = function( number ){
  if( 'string' !== typeof number || !number.length ){
    throw new Error( 'invalid number' );
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

module.exports = Address;
