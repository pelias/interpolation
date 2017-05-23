
var project = require('../../lib/project'),
    polyline = require('@mapbox/polyline');

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
    t.deepEqual(res, [ 6.552528952537812, -3.603890923895796 ]);
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
      dist: 2.1670179275017025,
      edge: [ [ 0, 0 ], [ 10, -5.5 ] ],
      point: [ 6.552528952537812, -3.603890923895796 ]
    });
    t.end();
  });
};

module.exports.project.distance = function(test) {
  test('distance: simple', function(t) {

    var p1 = [ 0.0, 1.0 ],
        p2 = [ 1.0, 0.0 ];

    var res = project.distance( p1, p2 );
    t.equal(res, 1.414177660952114);
    t.end();
  });
  test('distance: complex', function(t) {

    var p1 = [ -2.2, 1.1 ],
        p2 = [ -8.1, 9.2 ];

    var res = project.distance( p1, p2 );
    t.equal(res, 10.00401571386437);
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
    t.equal(res, 20);
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
    t.equal(res, 40.01606285545748);
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
  test('parity: simple right', function(t) {

    var l = [
          [ 0.0, -10.0 ],
          [ 0.0,   0.0 ],
          [ 0.0, +10.0 ],
        ],
        p = [ +10, 0 ],
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
  test('parity: simple left', function(t) {

    var l = [
          [ 0.0, -10.0 ],
          [ 0.0,   0.0 ],
          [ 0.0, +10.0 ],
        ],
        p = [ -10, 0 ],
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
    t.equal(res, null);
    t.end();
  });
  test('parity: simple neither', function(t) {

    var l = [
          [ 0.0, -10.0 ],
          [ 0.0,   0.0 ],
          [ 0.0, +10.0 ],
        ],
        p = [ 0, 0 ],
        proj = project.pointOnLine( l, p );

    var res = project.parity( proj, p );
    t.equal(res, null);
    t.end();
  });

  test('parity: complex real-world', function(t) {

    var poly = '{atccBwldlXjF}H|OwM??xnB}yArAcDt@cErAkQ',
        l = polyline.toGeoJSON(poly, 6).coordinates;

    var expected = [
      { point: [ 13.3231349, 52.5046393 ], parity: 'R' },
      { point: [ 13.3232845, 52.5044741 ], parity: 'R' },
      { point: [ 13.3234757, 52.5042391 ], parity: 'R' },
      { point: [ 13.3236668, 52.504004  ], parity: 'R' },
      { point: [ 13.3237503, 52.5039014 ], parity: 'R' },
      { point: [ 13.3238472, 52.5037822 ], parity: 'R' },
      { point: [ 13.3238982, 52.5037196 ], parity: 'R' },
      { point: [ 13.3240774, 52.5034993 ], parity: 'R' },
      { point: [ 13.3242406, 52.5032985 ], parity: 'R' },
      { point: [ 13.324596,  52.5035259 ], parity: 'L' },
      { point: [ 13.3244426, 52.5037368 ], parity: 'L' },
      { point: [ 13.3242319, 52.5039756 ], parity: 'L' },
      { point: [ 13.3240857, 52.5041548 ], parity: 'L' },
      { point: [ 13.324045,  52.5042048 ], parity: 'L' },
      { point: [ 13.3239275, 52.5043478 ], parity: 'L' },
      { point: [ 13.3238652, 52.5044245 ], parity: 'L' },
      { point: [ 13.323773,  52.5045378 ], parity: 'L' },
      { point: [ 13.3236578, 52.5046793 ], parity: 'L' },
      { point: [ 13.3234623, 52.5050013 ], parity: 'L' },
      { point: [ 13.3219716, 52.5067516 ], parity: 'L' },
      { point: [ 13.3217595, 52.5070123 ], parity: 'L' },
      { point: [ 13.3215594, 52.5072582 ], parity: 'L' },
      { point: [ 13.3213608, 52.5075021 ], parity: 'L' },
      { point: [ 13.3213222, 52.5075497 ], parity: 'L' },
      { point: [ 13.3211361, 52.5077825 ], parity: 'L' },
      { point: [ 13.3209319, 52.5080292 ], parity: 'L' },
      { point: [ 13.3207726, 52.5082468 ], parity: 'L' },
      { point: [ 13.3206005, 52.5084363 ], parity: 'L' },
      { point: [ 13.3204313, 52.5086452 ], parity: 'L' },
    ];

    expected.forEach( function( exp ){
      var proj = project.pointOnLine( l, exp.point );
      var res = project.parity( proj, exp.point );
      t.equal(res, exp.parity);
    });

    t.end();
  });
};

module.exports.project.bearing = function(test) {
  test('bearing: north', function(t) {

    var p1 = [ 0.0, 0.0 ],
        p2 = [ 0.0, 1.0 ];

    var res = project.bearing( p1, p2 );
    t.equal(res, 0);
    t.end();
  });
  test('bearing: northeast', function(t) {

    var p1 = [ 0.0, 0.0 ],
        p2 = [ 1.0, 1.0 ];

    var res = project.bearing( p1, p2 );
    t.equal(res, 44.99563645534486);
    t.end();
  });
  test('bearing: east', function(t) {

    var p1 = [ 0.0, 0.0 ],
        p2 = [ 1.0, 0.0 ];

    var res = project.bearing( p1, p2 );
    t.equal(res, 90);
    t.end();
  });
  test('bearing: southeast', function(t) {

    var p1 = [ -1.0, 1.0 ],
        p2 = [  0.0, 0.0 ];

    var res = project.bearing( p1, p2 );
    t.equal(res, 134.99563645534485);
    t.end();
  });
  test('bearing: south', function(t) {

    var p1 = [ 0.0,  0.0 ],
        p2 = [ 0.0, -1.0 ];

    var res = project.bearing( p1, p2 );
    t.equal(res, 180);
    t.end();
  });
  test('bearing: southwest', function(t) {

    var p1 = [ 1.0, 1.0 ],
        p2 = [ 0.0, 0.0 ];

    var res = project.bearing( p1, p2 );
    t.equal(res, -134.99563645534485);
    t.end();
  });
  test('bearing: west', function(t) {

    var p1 = [  0.0, 0.0 ],
        p2 = [ -1.0, 0.0 ];

    var res = project.bearing( p1, p2 );
    t.equal(res, -90);
    t.end();
  });
  test('bearing: northwest', function(t) {

    var p1 = [  0.0, 0.0 ],
        p2 = [ -1.0, 1.0 ];

    var res = project.bearing( p1, p2 );
    t.equal(res, -44.99563645534486);
    t.end();
  });

  test('bearing: complex', function(t) {

    var p1 = [ -2.2, 1.1 ],
        p2 = [ -8.1, 9.2 ];

    var res = project.bearing( p1, p2 );
    t.equal(res, -35.740257158176355);
    t.end();
  });
};

module.exports.project.dedupe = function(test) {

  var encoded = 'q~|ccB{}npXhv@}H??pv@cH??xz@kI??fi@yD??tD[~Dc@??lDa@??tPaB??jZ{C??j[}C??fIeA??dE]??ze@eE??l_@cD??jVcC';

  test('dedupe', function(t) {

    var decoded = polyline.decode( encoded, 6 );
    var deduped = project.dedupe( decoded );

    // assert records removed
    t.equal(decoded.length, 29);
    t.equal(deduped.length, 16);

    // count occurrences of '52.505725|13.394564'
    t.equal(decoded.filter(function( coord ){
      return coord[0] === 52.505725 && coord[1] === 13.394564;
    }).length, 2);

    // count occurrences of '52.505725|13.394564'
    t.equal(deduped.filter(function( coord ){
      return coord[0] === 52.505725 && coord[1] === 13.394564;
    }).length, 1);

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
