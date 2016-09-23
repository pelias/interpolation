
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

module.exports.project.distance = function(test) {
  test('distance: simple', function(t) {

    var p1 = [ 0.0, 1.0 ],
        p2 = [ 1.0, 0.0 ];

    var res = project.distance( p1, p2 );
    t.equal(res, Math.hypot( 1, 1 ));
    t.end();
  });
  test('distance: complex', function(t) {

    var p1 = [ -2.2, 1.1 ],
        p2 = [ -8.1, 9.2 ];

    var res = project.distance( p1, p2 );
    t.equal(res, Math.hypot( -5.9, 8.1 ));
    t.end();
  });
};

module.exports.project.lineDistance = function(test) {
  test('lineDistance: simple', function(t) {

    var l = [
          [ -10.0, 0.0 ],
          [   0.0, 0.0 ],
          [ +10.0, 0.0 ],
        ];

    var res = project.lineDistance( l );
    t.equal(res, 20.0);
    t.end();
  });
  test('lineDistance: complex', function(t) {

    var l = [
          [ -2.2, 1.1 ],
          [ -8.1, 9.2 ],
          [ -2.2, 1.1 ],
          [ -8.1, 9.2 ],
          [ -2.2, 1.1 ],
        ];

    var res = project.lineDistance( l );
    t.equal(res, Math.hypot( -5.9, 8.1 )*4);
    t.end();
  });
};

module.exports.project.sliceLineAtProjection = function(test) {
  test('sliceLineAtProjection: simple', function(t) {

    var l = [
          [ -10.0, 0.0 ],
          [   0.0, 0.0 ],
          [ +10.0, 0.0 ],
        ],
        proj = project.pointOnLine( l, [ 0, 0 ] );

    var res = project.sliceLineAtProjection( l, proj );
    t.deepEqual(res, [ [ -10, 0 ], [ 0, 0 ] ]);
    t.end();
  });
  test('sliceLineAtProjection: complex', function(t) {

    var l = [
          [ -2.2, 0.0 ],
          [ -3.3, 0.0 ],
          [ -4.4, 0.0 ],
          [ -5.5, 0.0 ],
          [ -6.6, 0.0 ],
        ],
        proj = project.pointOnLine( l, [ -3.8, 10 ] );

    var res = project.sliceLineAtProjection( l, proj );
    t.deepEqual(res, [ [ -2.2, 0 ], [ -3.3, 0 ], [ -3.8, 0 ] ]);
    t.end();
  });
};

module.exports.project.parity = function(test) {
  test('parity: simple right', function(t) {

    var l = [
          [ -10.0, 0.0 ],
          [   0.0, 0.0 ],
          [ +10.0, 0.0 ],
        ],
        p = [ 0, -10 ],
        proj = project.pointOnLine( l, p );

    var res = project.parity( proj, p );
    t.equal(res, 'R');
    t.end();
  });
  test('parity: simple left', function(t) {

    var l = [
          [ -10.0, 0.0 ],
          [   0.0, 0.0 ],
          [ +10.0, 0.0 ],
        ],
        p = [ 0, +10 ],
        proj = project.pointOnLine( l, p );

    var res = project.parity( proj, p );
    t.equal(res, 'L');
    t.end();
  });
  test('parity: simple neither', function(t) {

    var l = [
          [ -10.0, 0.0 ],
          [   0.0, 0.0 ],
          [ +10.0, 0.0 ],
        ],
        p = [ 0, 0 ],
        proj = project.pointOnLine( l, p );

    var res = project.parity( proj, p );
    t.equal(res, '?');
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
