
var Address = require('../../lib/Address');

module.exports.street = {};

module.exports.street.constructor = function(test) {
  test('constructor', function(t) {
    var s = new Address();
    t.equal(s.id, null);
    t.equal(s.source, null);
    t.deepEqual(s.coords, {});
    t.equal(s.number, null);
    t.equal(s.street, null);
    t.equal(s.unit, null);
    t.equal(s.city, null);
    t.equal(s.district, null);
    t.equal(s.region, null);
    t.equal(s.postcode, null);
    t.end();
  });
};

module.exports.street.id = function(test) {
  test('getId', function(t) {
    var s = new Address();
    t.equal(s.getId(), null);
    s.id = 1;
    t.equal(s.getId(), 1);
    t.end();
  });
  test('setId', function(t) {
    var s = new Address();
    t.equal(s.id, null);
    s.setId('1');
    t.equal(s.id, '1');
    t.end();
  });
  test('setId - type coersion', function(t) {
    var s = new Address();
    t.equal(s.id, null);
    s.setId(22);
    t.equal(s.id, '22');
    t.end();
  });
  test('setId - invalid', function(t) {
    var s = new Address();
    t.throws(function(){ s.setId(0); }, /invalid id/);
    t.throws(function(){ s.setId(null); }, /invalid id/);
    t.throws(function(){ s.setId(''); }, /invalid id/);
    t.throws(function(){ s.setId({}); }, /invalid id/);
    t.throws(function(){ s.setId([]); }, /invalid id/);
    t.end();
  });
};

module.exports.street.source = function(test) {
  test('getSource', function(t) {
    var s = new Address();
    t.equal(s.getSource(), null);
    s.source = 'example';
    t.equal(s.getSource(), 'example');
    t.end();
  });
  test('setSource', function(t) {
    var s = new Address();
    t.equal(s.source, null);
    s.setSource('example');
    t.equal(s.source, 'example');
    t.end();
  });
  test('setSource - invalid', function(t) {
    var s = new Address();
    t.throws(function(){ s.setSource(0); }, /invalid source/);
    t.throws(function(){ s.setSource(1); }, /invalid source/);
    t.throws(function(){ s.setSource(null); }, /invalid source/);
    t.throws(function(){ s.setSource(''); }, /invalid source/);
    t.throws(function(){ s.setSource([]); }, /invalid source/);
    t.throws(function(){ s.setSource({}); }, /invalid source/);
    t.end();
  });
};

module.exports.street.coord = function(test) {
  test('getCoord', function(t) {
    var s = new Address();
    t.deepEqual(s.getCoord(), undefined);
    s.coords.default = { lat: 1.1, lon: -2.2 };
    t.deepEqual(s.getCoord(), { lat: 1.1, lon: -2.2 });
    t.end();
  });
  test('getCoord - type', function(t) {
    var s = new Address();
    t.deepEqual(s.getCoord(), undefined);
    s.coords.foo = { lat: 1.1, lon: -2.2 };
    t.deepEqual(s.getCoord('foo'), { lat: 1.1, lon: -2.2 });
    t.end();
  });
  test('setCoord', function(t) {
    var s = new Address();
    t.deepEqual(s.coords, {});
    s.setCoord({ lat: 1.1, lon: -2.2 });
    t.deepEqual(s.coords, { default: { lat: 1.1, lon: -2.2 } });
    t.end();
  });
  test('setCoord - string', function(t) {
    var s = new Address();
    t.deepEqual(s.coords, {});
    s.setCoord({ lat: '1.1', lon: '-2.2' });
    t.deepEqual(s.coords, { default: { lat: 1.1, lon: -2.2 } });
    t.end();
  });
  test('setCoord - type', function(t) {
    var s = new Address();
    t.deepEqual(s.coords, {});
    s.setCoord({ lat: 1.1, lon: -2.2 }, 'foo');
    t.deepEqual(s.coords, { foo: { lat: 1.1, lon: -2.2 } });
    t.end();
  });
  test('setCoord - invalid', function(t) {
    var s = new Address();
    t.throws(function(){ s.setCoord(0); }, /invalid coord/);
    t.throws(function(){ s.setCoord(null); }, /invalid coord/);
    t.throws(function(){ s.setCoord(''); }, /invalid coord/);
    t.throws(function(){ s.setCoord({}); }, /invalid coord/);
    t.throws(function(){ s.setCoord({ lat: 1 }); }, /invalid coord/);
    t.throws(function(){ s.setCoord({ lat: '', lon: '' }); }, /invalid lat/);
    t.throws(function(){ s.setCoord({ lat: '1.2', lon: '' }); }, /invalid lon/);
    t.end();
  });
};

module.exports.street.number = function(test) {
  test('getNumber', function(t) {
    var s = new Address();
    t.equal(s.getNumber(), null);
    s.number = '1a';
    t.equal(s.getNumber(), '1a');
    t.end();
  });
  test('setNumber', function(t) {
    var s = new Address();
    t.equal(s.number, null);
    s.setNumber('1a');
    t.equal(s.number, '1a');
    t.end();
  });
  test('setNumber - invalid', function(t) {
    var s = new Address();
    t.throws(function(){ s.setNumber(0); }, /invalid house number/);
    t.throws(function(){ s.setNumber(1); }, /invalid house number/);
    t.throws(function(){ s.setNumber(null); }, /invalid house number/);
    t.throws(function(){ s.setNumber(''); }, /invalid house number/);
    t.throws(function(){ s.setNumber([]); }, /invalid house number/);
    t.throws(function(){ s.setNumber({}); }, /invalid house number/);
    t.end();
  });
};

module.exports.street.street = function(test) {
  test('getStreet', function(t) {
    var s = new Address();
    t.equal(s.getStreet(), null);
    s.street = 'sesame street';
    t.equal(s.getStreet(), 'sesame street');
    t.end();
  });
  test('setStreet', function(t) {
    var s = new Address();
    t.equal(s.street, null);
    s.setStreet('sesame street');
    t.equal(s.street, 'sesame street');
    t.end();
  });
  test('setStreet - invalid', function(t) {
    var s = new Address();
    t.throws(function(){ s.setStreet(0); }, /invalid street/);
    t.throws(function(){ s.setStreet(1); }, /invalid street/);
    t.throws(function(){ s.setStreet(null); }, /invalid street/);
    t.throws(function(){ s.setStreet(''); }, /invalid street/);
    t.throws(function(){ s.setStreet([]); }, /invalid street/);
    t.throws(function(){ s.setStreet({}); }, /invalid street/);
    t.end();
  });
};

module.exports.street.unit = function(test) {
  test('getUnit', function(t) {
    var s = new Address();
    t.equal(s.getUnit(), null);
    s.unit = '101';
    t.equal(s.getUnit(), '101');
    t.end();
  });
  test('setUnit', function(t) {
    var s = new Address();
    t.equal(s.unit, null);
    s.setUnit('101');
    t.equal(s.unit, '101');
    t.end();
  });
  test('setUnit - invalid', function(t) {
    var s = new Address();
    t.throws(function(){ s.setUnit(0); }, /invalid unit/);
    t.throws(function(){ s.setUnit(1); }, /invalid unit/);
    t.throws(function(){ s.setUnit(null); }, /invalid unit/);
    t.throws(function(){ s.setUnit(''); }, /invalid unit/);
    t.throws(function(){ s.setUnit([]); }, /invalid unit/);
    t.throws(function(){ s.setUnit({}); }, /invalid unit/);
    t.end();
  });
};

module.exports.street.city = function(test) {
  test('getCity', function(t) {
    var s = new Address();
    t.equal(s.getCity(), null);
    s.city = 'example city';
    t.equal(s.getCity(), 'example city');
    t.end();
  });
  test('setCity', function(t) {
    var s = new Address();
    t.equal(s.city, null);
    s.setCity('example city');
    t.equal(s.city, 'example city');
    t.end();
  });
  test('setCity - invalid', function(t) {
    var s = new Address();
    t.throws(function(){ s.setCity(0); }, /invalid city/);
    t.throws(function(){ s.setCity(1); }, /invalid city/);
    t.throws(function(){ s.setCity(null); }, /invalid city/);
    t.throws(function(){ s.setCity(''); }, /invalid city/);
    t.throws(function(){ s.setCity([]); }, /invalid city/);
    t.throws(function(){ s.setCity({}); }, /invalid city/);
    t.end();
  });
};

module.exports.street.district = function(test) {
  test('getDistrict', function(t) {
    var s = new Address();
    t.equal(s.getDistrict(), null);
    s.district = 'example district';
    t.equal(s.getDistrict(), 'example district');
    t.end();
  });
  test('setDistrict', function(t) {
    var s = new Address();
    t.equal(s.district, null);
    s.setDistrict('example district');
    t.equal(s.district, 'example district');
    t.end();
  });
  test('setDistrict - invalid', function(t) {
    var s = new Address();
    t.throws(function(){ s.setDistrict(0); }, /invalid district/);
    t.throws(function(){ s.setDistrict(1); }, /invalid district/);
    t.throws(function(){ s.setDistrict(null); }, /invalid district/);
    t.throws(function(){ s.setDistrict(''); }, /invalid district/);
    t.throws(function(){ s.setDistrict([]); }, /invalid district/);
    t.throws(function(){ s.setDistrict({}); }, /invalid district/);
    t.end();
  });
};

module.exports.street.region = function(test) {
  test('getRegion', function(t) {
    var s = new Address();
    t.equal(s.getRegion(), null);
    s.region = 'example region';
    t.equal(s.getRegion(), 'example region');
    t.end();
  });
  test('setRegion', function(t) {
    var s = new Address();
    t.equal(s.region, null);
    s.setRegion('example region');
    t.equal(s.region, 'example region');
    t.end();
  });
  test('setRegion - invalid', function(t) {
    var s = new Address();
    t.throws(function(){ s.setRegion(0); }, /invalid region/);
    t.throws(function(){ s.setRegion(1); }, /invalid region/);
    t.throws(function(){ s.setRegion(null); }, /invalid region/);
    t.throws(function(){ s.setRegion(''); }, /invalid region/);
    t.throws(function(){ s.setRegion([]); }, /invalid region/);
    t.throws(function(){ s.setRegion({}); }, /invalid region/);
    t.end();
  });
};

module.exports.street.postcode = function(test) {
  test('getPostcode', function(t) {
    var s = new Address();
    t.equal(s.getPostcode(), null);
    s.postcode = 'example postcode';
    t.equal(s.getPostcode(), 'example postcode');
    t.end();
  });
  test('setPostcode', function(t) {
    var s = new Address();
    t.equal(s.postcode, null);
    s.setPostcode('example postcode');
    t.equal(s.postcode, 'example postcode');
    t.end();
  });
  test('setPostcode - invalid', function(t) {
    var s = new Address();
    t.throws(function(){ s.setPostcode(0); }, /invalid postcode/);
    t.throws(function(){ s.setPostcode(1); }, /invalid postcode/);
    t.throws(function(){ s.setPostcode(null); }, /invalid postcode/);
    t.throws(function(){ s.setPostcode(''); }, /invalid postcode/);
    t.throws(function(){ s.setPostcode([]); }, /invalid postcode/);
    t.throws(function(){ s.setPostcode({}); }, /invalid postcode/);
    t.end();
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('address: ' + name, testFunction);
  }

  for( var testCase in module.exports.street ){
    module.exports.street[testCase](test);
  }
};
