const search = require('../../query/search');

module.exports.search = {};

module.exports.search.basic = function(test) {
  test('foo', function(t) {

    const db = {
      prepare: () => {
        return {
          all: () => { return 999; }
        };
      }
    };

    const point = {
      lat: 12.21,
      lon: 34.43
    };

    const housenumber = 678;

    const names = [ 'west 26 street', 'west 26 saint'];

    t.equal(999, search(db, point, housenumber, names));

    t.end();
  });

};


module.exports.all = function run(tape) {

  function test(name, testFunction) {
    return tape('query/search: ' + name, testFunction);
  }

  for( var testCase in module.exports.search ){
    module.exports.search[testCase](test);
  }
};

