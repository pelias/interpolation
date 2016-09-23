
var analyze = require('../../lib/analyze');

module.exports.analyze = {};

module.exports.analyze.street = function(test) {
  test('street: synonym expansions', function(t) {
    var perms = analyze.street("grolmanstraße");
    t.deepEqual(perms, ['grolmanstrasse', 'grolman strasse']);
    t.end();
  });
  test('street: remove ordinals', function(t) {
    var perms = analyze.street("West 26th st");
    t.deepEqual(perms, ['west 26 saint', 'west 26 street']);
    t.end();
  });
  test('street: always returns array', function(t) {
    var perms = analyze.street("");
    t.deepEqual(perms, ['']);
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
