
var project = require('../../lib/project');

module.exports.project = {};

module.exports.project.pointOnEdge = function(test) {
  test('pointOnEdge: simple', function(t) {

    var v = [ -10.0, 0.0 ],
        u = [ +10.0, 0.0 ],
        p = [ 0, 10.0 ];

    var res = project.pointOnEdge( v, u, p );
    t.deepEqual(res, [ 0, 0 ]);
    t.end();
  });
  test('pointOnEdge: complex', function(t) {

    var v = [ -10.0, +5.5 ],
        u = [ +10.0, -5.5 ],
        p = [ +5.5, -5.5 ];

    var res = project.pointOnEdge( v, u, p );
    t.deepEqual(res, [ 6.54510556621881, -3.5998080614203456 ]);
    t.end();
  });
};

module.exports.project.pointOnLine = function(test) {
  test('pointOnLine: simple', function(t) {

    var l = [
          [ -10.0, 0.0 ],
          [   0.0, 0.0 ],
          [ +10.0, 0.0 ],
        ],
        p = [ 0, 10.0 ];

    var res = project.pointOnLine( l, p );
    t.deepEqual(res, {
      dist: 10,
      edge: [ [ -10, 0 ], [ 0, 0 ] ],
      point: [ 0, 0 ]
    });
    t.end();
  });
  test('pointOnLine: complex', function(t) {

    var l = [
          [ -10.0, +5.5 ],
          [   0.0,  0.0 ],
          [ +10.0, -5.5 ],
        ],
        p = [ +5.5, -5.5 ];

    var res = project.pointOnLine( l, p );
    t.deepEqual(res, {
      dist: 2.1686343739747014,
      edge: [ [ 0, 0 ], [ 10, -5.5 ] ],
      point: [ 6.54510556621881, -3.5998080614203456 ]
    });
    t.end();
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('project: ' + name, testFunction);
  }

  for( var testCase in module.exports.project ){
    module.exports.project[testCase](test);
  }
};
