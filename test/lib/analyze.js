
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
  test('housenumber: junk', function(t) {
    var float = analyze.housenumber('22 foo');
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

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('analyze: ' + name, testFunction);
  }

  for( var testCase in module.exports.analyze ){
    module.exports.analyze[testCase](test);
  }
};
