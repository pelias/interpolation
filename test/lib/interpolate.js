
var project = require('../../lib/project');
var interpolate = require('../../lib/interpolate');

module.exports.interpolate = {};

module.exports.interpolate.basic = function(test) {

  var street = {
    id: 1,
    line: '|nbwmAgo}ilIsA\\cA?qG|@}J\\qHpGaCzA??uD|@{A?iB?wD}@_D{@mJyCwC]sB???cA?}JvC??eTrG??qCxAoCzBqCvCcFjK??{AvDsAtDUxCOtDGtEVtE',
    coordinates:
     [ [ 174.767364, -41.289471 ],
       [ 174.767349, -41.289429 ],
       [ 174.767349, -41.289395 ],
       [ 174.767318, -41.289258 ],
       [ 174.767303, -41.289067 ],
       [ 174.767166, -41.288914 ],
       [ 174.76712, -41.288849 ],
       [ 174.76712, -41.288849 ],
       [ 174.767089, -41.288758 ],
       [ 174.767089, -41.288712 ],
       [ 174.767089, -41.288659 ],
       [ 174.76712, -41.288567 ],
       [ 174.76715, -41.288487 ],
       [ 174.767227, -41.288304 ],
       [ 174.767242, -41.288228 ],
       [ 174.767242, -41.28817 ],
       [ 174.767242, -41.28817 ],
       [ 174.767242, -41.288136 ],
       [ 174.767166, -41.287945 ],
       [ 174.767166, -41.287945 ],
       [ 174.767028, -41.287606 ],
       [ 174.767028, -41.287606 ],
       [ 174.766983, -41.287533 ],
       [ 174.766921, -41.287461 ],
       [ 174.766845, -41.287388 ],
       [ 174.766647, -41.287274 ],
       [ 174.766647, -41.287274 ],
       [ 174.766555, -41.287228 ],
       [ 174.766464, -41.287186 ],
       [ 174.766387, -41.287175 ],
       [ 174.766296, -41.287167 ],
       [ 174.766189, -41.287163 ],
       [ 174.766082, -41.287175 ] ],
    scheme: 'zigzag'
  };

  var distances = [
    { housenumber: 26, dist: 0.0003225718070197516, parity: 'L' },
    { housenumber: 24, dist: 0.0005224138772313285, parity: 'L' },
    { housenumber: 22, dist: 0.0006999033112531882, parity: 'L' },
    { housenumber: 20, dist: 0.0007639890179167344, parity: 'L' },
    { housenumber: 18, dist: 0.0007917883736660637, parity: 'L' },
    { housenumber: 12, dist: 0.0011037637066229587, parity: 'L' },
    { housenumber: 10, dist: 0.0012918205388906116, parity: 'L' },
    { housenumber: 11, dist: 0.0014973796658555405, parity: 'R' },
    { housenumber: 9,  dist: 0.0017108525172548506, parity: 'R' },
    { housenumber: 7,  dist: 0.0017141786350434941, parity: 'R' },
    { housenumber: 1,  dist: 0.002472630006661142,  parity: 'R' }
  ];

  test('basic: interpolate all vertexes', function(t) {

    var expected = [
      undefined,
      null,
      null,
      null,
      25.14720176909508,
      23.213734429122503,
      22.384181635458635,
      22.384181635458635,
      20.132507678837417,
      17.731618778762645,
      16.71230742197189,
      14.887105805226007,
      13.288610165912312,
      10.671402112020003,
      null,
      null,
      null,
      null,
      10.06783875730516,
      10.06783875730516,
      5.12353642243998,
      5.12353642243998,
      4.487101193833508,
      3.808684614843684,
      3.075479268861323,
      1.5927212037942091,
      1.5927212037942091,
      null,
      null,
      null,
      null,
      null,
      null
    ];

    var vertexDistance = 0;

    var interpolations = street.coordinates.map( function( vertex, i ){

      // not a line, just a single point;
      if( 0 === i ){ return; }

      // distance along line to this vertex
      var edge = street.coordinates.slice(i-1, i+1);
      if( edge.length === 2 ){
        vertexDistance += project.lineDistance( edge );
      }

      return interpolate( distances, vertexDistance );
    });

    t.deepEqual(interpolations, expected);
    t.end();
  });
};


module.exports.interpolate.disjoined = function(test) {

  var street = {
    id: 1,
    scheme: 'updown',
    coordinates:
     [
       [ 13.321915, 52.506366 ],
       [ 13.321858, 52.506576 ],
       [ 13.321706, 52.506763 ],
       [ 13.321237, 52.507347 ],
       [ 13.321167, 52.507431 ],
       [ 13.321031, 52.507606 ],
       [ 13.320506, 52.50827 ],
       [ 13.320116, 52.508762 ],
       [ 13.319979, 52.50893 ]
    ]
  };

  var distances = [
    { housenumber: 23,   dist: 0.00042148155196904385, parity: 'L' },
    { housenumber: 22,   dist: 0.0007843246119919755,  parity: 'L' },
    { housenumber: 21,   dist: 0.001034840286259675,   parity: 'L' },
    { housenumber: 20,   dist: 0.0015859965358894477,  parity: 'L' },
    { housenumber: 19,   dist: 0.001794025058182304,   parity: 'L' },
    { housenumber: 18,   dist: 0.001953544650454525,   parity: 'L' },
    { housenumber: 16,   dist: 0.002096181353749726,   parity: 'L' },
    { housenumber: 17,   dist: 0.002096181353749726,   parity: 'L' },
    { housenumber: 16.1, dist: 0.002277308805327599,   parity: 'L' },
    { housenumber: 15,   dist: 0.002509092353329636,   parity: 'L' },
    { housenumber: 14.1, dist: 0.0026424495806269196,  parity: 'L' },
    { housenumber: 14,   dist: 0.002830004409226574,   parity: 'L' } ];

  test('disjoined: interpolate all vertexes', function(t) {

    var expected = [
      undefined,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ];

    var vertexDistance = 0;

    var interpolations = street.coordinates.map( function( vertex, i ){

      // not a line, just a single point;
      if( 0 === i ){ return; }

      // distance along line to this vertex
      var edge = street.coordinates.slice(i-1, i+1);
      if( edge.length === 2 ){
        vertexDistance += project.lineDistance( edge );
      }

      return interpolate( distances, vertexDistance );
    });

    t.deepEqual(interpolations, expected);
    t.end();
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('interpolate: ' + name, testFunction);
  }

  for( var testCase in module.exports.interpolate ){
    module.exports.interpolate[testCase](test);
  }
};
