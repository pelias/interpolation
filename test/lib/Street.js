
var Street = require('../../lib/Street');

module.exports.street = {};

module.exports.street.constructor = function(test) {
  test('constructor', function(t) {
    var s = new Street();
    t.equal(s.id, null);
    t.deepEqual(s.names, []);
    t.equal(s.bbox, null);
    t.equal(s.encoded, null);
    t.equal(s.decoded, null);
    t.equal(s.precision, null);
    t.end();
  });
};

module.exports.street.id = function(test) {
  test('getId', function(t) {
    var s = new Street();
    t.equal(s.getId(), null);
    s.id = 1;
    t.equal(s.getId(), 1);
    t.end();
  });
  test('setId', function(t) {
    var s = new Street();
    t.equal(s.id, null);
    s.setId(1);
    t.equal(s.id, 1);
    t.end();
  });
  test('setId - invalid', function(t) {
    var s = new Street();
    t.throws(function(){ s.setId(0); }, /invalid id/);
    t.throws(function(){ s.setId(null); }, /invalid id/);
    t.throws(function(){ s.setId(''); }, /invalid id/);
    t.end();
  });
};

module.exports.street.names = function(test) {
  test('getNames', function(t) {
    var s = new Street();
    t.deepEqual(s.getNames(), []);
    s.names = ['a'];
    t.deepEqual(s.getNames(), ['a']);
    t.end();
  });
  test('setNames', function(t) {
    var s = new Street();
    t.deepEqual(s.names, []);
    s.setNames(['a']);
    t.deepEqual(s.names, ['a']);
    t.end();
  });
  test('setNames - invalid', function(t) {
    var s = new Street();
    t.throws(function(){ s.setNames(0); }, /invalid names/);
    t.throws(function(){ s.setNames(null); }, /invalid names/);
    t.throws(function(){ s.setNames(''); }, /invalid names/);
    t.throws(function(){ s.setNames([]); }, /invalid names/);
    t.end();
  });
  test('setNames - trim newlines and spaces', function(t) {
    var s = new Street();
    t.deepEqual(s.names, []);
    s.setNames([' a \n', ' b']);
    t.deepEqual(s.names, ['a', 'b']);
    t.end();
  });
};

module.exports.street.bbox = function(test) {
  test('getBbox', function(t) {
    var s = new Street();
    t.deepEqual(s.getBbox(), null);
    s.bbox = { minX: 1, minY: 1, maxX: 2, maxY: 2 };
    t.deepEqual(s.getBbox(), { minX: 1, minY: 1, maxX: 2, maxY: 2 });
    t.end();
  });
  test('getBbox - lazy', function(t) {
    var s = new Street();
    t.deepEqual(s.getBbox(), null);
    s.encoded = 'osf_cBqc`hXg`Br[';
    s.precision = 6;
    t.deepEqual(s.getBbox(), { maxX: 13.255241, maxY: 52.434268, minX: 13.254783, minY: 52.432712 });
    t.end();
  });
  test('setBbox', function(t) {
    var s = new Street();
    t.deepEqual(s.bbox, null);
    s.setBbox({ minX: 1, minY: 1, maxX: 2, maxY: 2 });
    t.deepEqual(s.bbox, { minX: 1, minY: 1, maxX: 2, maxY: 2 });
    t.end();
  });
  test('setBbox - invalid', function(t) {
    var s = new Street();
    t.throws(function(){ s.setBbox(0); }, /invalid bbox/);
    t.throws(function(){ s.setBbox(null); }, /invalid bbox/);
    t.throws(function(){ s.setBbox(''); }, /invalid bbox/);
    t.throws(function(){ s.setBbox([]); }, /invalid bbox/);
    t.throws(function(){ s.setBbox({}); }, /invalid bbox/);
    t.end();
  });
};

module.exports.street.encoded = function(test) {
  test('getEncodedPolyline', function(t) {
    var s = new Street();
    t.deepEqual(s.getEncodedPolyline(), null);
    s.encoded = 'osf_cBqc`hXg`Br[';
    t.deepEqual(s.getEncodedPolyline(), 'osf_cBqc`hXg`Br[');
    t.end();
  });
  test('getEncodedPolyline - lazy', function(t) {
    var s = new Street();
    t.deepEqual(s.getEncodedPolyline(), null);
    s.decoded = [[ 52.432712, 13.255241 ], [ 52.434268, 13.254783 ]];
    s.precision = 6;
    t.deepEqual(s.getEncodedPolyline(), 'osf_cBqc`hXg`Br[');
    t.end();
  });
  test('setEncodedPolyline', function(t) {
    var s = new Street();
    t.deepEqual(s.encoded, null);
    s.setEncodedPolyline('osf_cBqc`hXg`Br[', 6);
    t.deepEqual(s.encoded, 'osf_cBqc`hXg`Br[');
    t.deepEqual(s.precision, 6);
    t.end();
  });
  test('setEncodedPolyline - invalid', function(t) {
    var s = new Street();
    t.throws(function(){ s.setEncodedPolyline(0); }, /invalid polyline/);
    t.throws(function(){ s.setEncodedPolyline(null); }, /invalid polyline/);
    t.throws(function(){ s.setEncodedPolyline(''); }, /invalid polyline/);
    t.throws(function(){ s.setEncodedPolyline([]); }, /invalid polyline/);
    t.throws(function(){ s.setEncodedPolyline({}); }, /invalid polyline/);
    t.end();
  });
};

module.exports.street.decoded = function(test) {
  test('getDecodedPolyline', function(t) {
    var s = new Street();
    t.deepEqual(s.getDecodedPolyline(), null);
    s.decoded = [[ 52.432712, 13.255241 ], [ 52.434268, 13.254783 ]];
    t.deepEqual(s.getDecodedPolyline(), [[ 52.432712, 13.255241 ], [ 52.434268, 13.254783 ]]);
    t.end();
  });
  test('getDecodedPolyline - lazy', function(t) {
    var s = new Street();
    t.deepEqual(s.getDecodedPolyline(), null);
    s.encoded = 'osf_cBqc`hXg`Br[';
    s.precision = 6;
    t.deepEqual(s.getDecodedPolyline(), [[ 52.432712, 13.255241 ], [ 52.434268, 13.254783 ]]);
    t.end();
  });
  test('setDecodedPolyline', function(t) {
    var s = new Street();
    t.deepEqual(s.decoded, null);
    s.setDecodedPolyline([[ 52.432712, 13.255241 ], [ 52.434268, 13.254783 ]]);
    t.deepEqual(s.decoded, [[ 52.432712, 13.255241 ], [ 52.434268, 13.254783 ]]);
    t.end();
  });
  test('setDecodedPolyline - invalid', function(t) {
    var s = new Street();
    t.throws(function(){ s.setDecodedPolyline(0); }, /invalid coordinates/);
    t.throws(function(){ s.setDecodedPolyline(null); }, /invalid coordinates/);
    t.throws(function(){ s.setDecodedPolyline(''); }, /invalid coordinates/);
    t.throws(function(){ s.setDecodedPolyline([]); }, /invalid coordinates/);
    t.throws(function(){ s.setDecodedPolyline({}); }, /invalid coordinates/);
    t.end();
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('street: ' + name, testFunction);
  }

  for( var testCase in module.exports.street ){
    module.exports.street[testCase](test);
  }
};
