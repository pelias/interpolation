
var analyze = require('../../lib/analyze');

module.exports.analyze = {};

module.exports.analyze.street = function(test) {
  test('street: synonym expansions', function(t) {
    var perms = analyze.street('grolmanstraße');
    t.deepEqual(perms, ['grolmanstrasse', 'grolman strasse']);
    t.end();
  });
  test('street: remove ordinals', function(t) {
    var perms = analyze.street('West 26th st');
    t.deepEqual(perms, ['west 26 saint', 'west 26 street']);
    t.end();
  });
  test('street: always returns array', function(t) {
    var perms = analyze.street('');
    t.deepEqual(perms, ['']);
    t.end();
  });
};

module.exports.analyze.housenumber = function(test) {
  test('housenumber: invalid', function(t) {
    var float = analyze.housenumber('no numbers');
    t.true(isNaN(float), 'return NaN');
    t.end();
  });
  test('housenumber: invalid (range)', function(t) {
    var float = analyze.housenumber('1-1');
    t.true(isNaN(float), 'return NaN');
    t.end();
  });
  test('housenumber: invalid (apartment synonyms)', function(t) {
    var float = analyze.housenumber('1 flat b');
    t.true(isNaN(float), 'return NaN');
    t.end();
  });
  test('housenumber: invalid (punctuation)', function(t) {
    var float = analyze.housenumber('1/1');
    t.true(isNaN(float), 'return NaN');
    t.end();
  });
  test('housenumber: empty', function(t) {
    var float = analyze.housenumber('');
    t.true(isNaN(float), 'return NaN');
    t.end();
  });
  test('housenumber: numeric', function(t) {
    var float = analyze.housenumber('22');
    t.equal(float, 22);
    t.end();
  });
  test('housenumber: apartment', function(t) {
    var float = analyze.housenumber('22a');
    t.equal(float, 22.1);
    t.end();
  });
  test('housenumber: apartment with space', function(t) {
    var float = analyze.housenumber('22 B');
    t.equal(float, 22.2);
    t.end();
  });
};
module.exports.analyze.housenumberFloatToString = function(test) {
  test('housenumberFloatToString: invalid', function(t) {
    var str = analyze.housenumberFloatToString(/not a string/);
    t.equal(str, '', 'return empty string');
    t.end();
  });
  test('housenumberFloatToString: empty', function(t) {
    var str = analyze.housenumberFloatToString('');
    t.equal(str, '', 'return empty string');
    t.end();
  });
  test('housenumberFloatToString: numeric', function(t) {
    var str = analyze.housenumberFloatToString(22);
    t.equal(str, '22');
    t.end();
  });
  test('housenumberFloatToString: apartment A', function(t) {
    var str = analyze.housenumberFloatToString(22.1);
    t.equal(str, '22a');
    t.end();
  });
  test('housenumberFloatToString: apartment B', function(t) {
    var str = analyze.housenumberFloatToString(22.2);
    t.equal(str, '22b');
    t.end();
  });
  test('housenumberFloatToString: apartment C', function(t) {
    var str = analyze.housenumberFloatToString(22.3);
    t.equal(str, '22c');
    t.end();
  });
  test('housenumberFloatToString: apartment D', function(t) {
    var str = analyze.housenumberFloatToString(22.4);
    t.equal(str, '22d');
    t.end();
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('analyze: ' + name, testFunction);
  }

  for( var testCase in module.exports.analyze ){
    module.exports.analyze[testCase](test);
  }
};
