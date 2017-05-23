
var proximity = require('../../lib/proximity'),
    polyline = require('@mapbox/polyline');

module.exports.nearest = {};

module.exports.nearest.street = function(test) {
  test('street - simple', function(t) {

    var point = [ -0.162618, 51.462703 ];
    var streets = [
      polyline.toGeoJSON('un~caBfifIzApZzEfY`N|u@|SluAlPpH', 6), // farthest
      polyline.toGeoJSON('kzbdaBvl`IjFyDt@k@xLwJfNsJvq@qb@le@gYdYwM`W{F~NiD', 6), // second closest
      polyline.toGeoJSON('ombdaB~y`I`GyCdKsGhMwHvCiBj[uSj[kRrVkNbVuM`LqDbLoDvCJt@hA\fD?`B', 6), // third closest
      polyline.toGeoJSON('}ccdaBpm~HnD{@fCo@`ImBxAk@fJ{BxAo@xfAwa@nzAaj@', 6), // closest
    ];

    var res = proximity.nearest.street( streets, point );
    t.deepEqual(res.map( function( r ){ return r.street; }), [
      streets[3],
      streets[1],
      streets[2],
      streets[0]
    ]);
    t.end();
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('nearest: ' + name, testFunction);
  }

  for( var testCase in module.exports.nearest ){
    module.exports.nearest[testCase](test);
  }
};
