
var analyze = require('../../lib/analyze');

module.exports.analyze = {};

module.exports.analyze.street = function(test) {
  test('street: synonym expansions', function(t) {
    analyze.street('grolmanstraße', function(err, perms) {
      t.deepEqual(perms, ['grolmanstraße', 'grolman straße']);
      t.end();
    });
  });
  test('street: remove ordinals', function(t) {
    analyze.street('West 26th st', function(err, perms) {
      t.deepEqual(perms, ['west 26 street', 'west 26 saint']);
      t.end();
    });
  });
  test('street: always returns array', function(t) {
    analyze.street('', function(err, perms) {
      t.deepEqual(perms, ['']);
      t.end();
    });
  });
};

module.exports.analyze.housenumber = function(test) {

  test('housenumber: invalid', function(t) {
    t.true(isNaN(analyze.housenumber(/not a string/)), 'invalid type');
    t.true(isNaN(analyze.housenumber('no numbers')), 'no numbers');
    t.true(isNaN(analyze.housenumber('')), 'blank');
    t.true(isNaN(analyze.housenumber('0')), 'zero');
    t.true(isNaN(analyze.housenumber('0/0')), 'zero');
    t.true(isNaN(analyze.housenumber('NULL')), 'null');
    t.true(isNaN(analyze.housenumber('S/N')), 'no numbers');
    t.true(isNaN(analyze.housenumber('-9')), 'no house number');
    t.true(isNaN(analyze.housenumber('V')), 'no numbers');
    t.true(isNaN(analyze.housenumber('2-40')), 'possible range; possibly not');
    t.true(isNaN(analyze.housenumber('2/1')), 'ambiguous house/apt');
    t.true(isNaN(analyze.housenumber('1 flat b')), 'apartment synonyms');
    t.true(isNaN(analyze.housenumber('4--')), 'unrecognised delimiter');
    t.true(isNaN(analyze.housenumber('11-19')), 'large ranges');
    t.true(isNaN(analyze.housenumber('1-4')), 'ranges containing single digits');
    t.true(isNaN(analyze.housenumber('22/26')), 'invalid range delimiter');
    t.true(isNaN(analyze.housenumber('51.1')), 'arbitrary decimal suffix');
    t.true(isNaN(analyze.housenumber('260 UNIT #33')), 'common label "unit" (followed by a number)');
    t.true(isNaN(analyze.housenumber('1434 SUITE #2')), 'common label "suite" (followed by a number)');
    t.true(isNaN(analyze.housenumber('5285 #1')), 'hash delimited numeric suffix');
    t.end();
  });

  test('housenumber: valid', function(t) {
    t.false(isNaN(analyze.housenumber('1')), 'regular');
    t.false(isNaN(analyze.housenumber(' 2  A ')), 'spaces');
    t.false(isNaN(analyze.housenumber('3Z')), 'unusually high apartment');
    t.false(isNaN(analyze.housenumber('4/-')), 'null apartment');
    t.false(isNaN(analyze.housenumber('5/5')), 'same house/apt number');
    t.false(isNaN(analyze.housenumber('6-6')), 'same house/apt number');
    t.false(isNaN(analyze.housenumber('22-26')), 'small ranges');
    t.false(isNaN(analyze.housenumber('51.5')), 'decimal suffix');
    t.false(isNaN(analyze.housenumber('326 1/2')), 'half suffix');
    t.false(isNaN(analyze.housenumber('8¼')), 'quarter suffix');
    t.false(isNaN(analyze.housenumber('4701 #B')), 'hash delimited suffix');
    t.false(isNaN(analyze.housenumber('1434 UNIT #B')), 'remove common english label "unit"');
    t.false(isNaN(analyze.housenumber('1434 SUITE #B')), 'remove common english label "suite"');
    t.false(isNaN(analyze.housenumber('158號')), 'remove common mandarin label');
    t.false(isNaN(analyze.housenumber('240 4t')), 'remove unknown numeric component');
    t.false(isNaN(analyze.housenumber('27, 2º, 4ª')), 'spanish address');
    t.end();
  });

  test('housenumber: numeric', function(t) {
    var float = analyze.housenumber('22');
    t.equal(float, 22);
    t.end();
  });
  test('housenumber: apartment', function(t) {
    var float = analyze.housenumber('22a');
    t.equal(float, 22.03);
    var float2 = analyze.housenumber('22z');
    t.equal(float2, 22.78);
    t.end();
  });
  test('housenumber: apartment with space', function(t) {
    var float = analyze.housenumber('22 B');
    t.equal(float, 22.06);
    t.end();
  });
  test('housenumber: apartment with a character symbolizing null', function(t) {
    var float = analyze.housenumber('9/-');
    t.equal(float, 9);
    t.end();
  });
  test('housenumber: apartment with forward slash between number and letter', function(t) {
    var float = analyze.housenumber('1/A');
    t.equal(float, 1.03);
    var float2 = analyze.housenumber('200/F');
    t.equal(float2, 200.18);
    t.end();
  });
  test('housenumber: apartment with forward slash between number and another number', function(t) {
    var float = analyze.housenumber('200/22');
    t.true(isNaN(float), 'return NaN');
    var float2 = analyze.housenumber('1/2');
    t.true(isNaN(float2), 'return NaN');
    t.end();
  });
  test('housenumber: apartment with minus between number and letter', function(t) {
    var float = analyze.housenumber('28-H');
    t.equal(float, 28.24);
    var float2 = analyze.housenumber('200-A');
    t.equal(float2, 200.03);
    t.end();
  });
  test('housenumber: apartment with hash between number and letter', function(t) {
    var float = analyze.housenumber('100#A');
    t.equal(float, 100.03);
    var float2 = analyze.housenumber('14500 # N');
    t.equal(float2, 14500.42);
    t.end();
  });
  test('housenumber: apartment with minus between number and another number', function(t) {
    var float = analyze.housenumber('200-22');
    t.true(isNaN(float), 'return NaN');
    var float2 = analyze.housenumber('1-2');
    t.true(isNaN(float2), 'return NaN');
    t.end();
  });
  test('housenumber: apartment with forward slash delimiting same number', function(t) {
    var float = analyze.housenumber('1/1');
    t.equal(float, 1);
    var float2 = analyze.housenumber('28/28');
    t.equal(float2, 28);
    t.end();
  });
  test('housenumber: house ranges', function(t) {
    var float = analyze.housenumber('10-16');
    t.equal(float, 13);
    var float2 = analyze.housenumber('218-223');
    t.equal(float2, 220);
    t.end();
  });
  test('housenumber: decimal suffix', function(t) {
    var float = analyze.housenumber('51.5');
    t.equal(float, 51.5);
    t.end();
  });
  test('housenumber: fractional suffix', function(t) {
    var float = analyze.housenumber('326 1/2');
    t.equal(float, 326.5);
    var float2 = analyze.housenumber('1½');
    t.equal(float2, 1.5);
    var float3 = analyze.housenumber('1¼');
    t.equal(float3, 1.25);
    var float4 = analyze.housenumber('1¾');
    t.equal(float4, 1.74);
    t.end();
  });
  test('housenumber: hash delimited suffix', function(t) {
    var float = analyze.housenumber('4701 #B');
    t.equal(float, 4701.06);
    t.end();
  });
  // test('housenumber: hash delimited numeric suffix', function(t) {
  //   var float = analyze.housenumber('5285 #1');
  //   t.equal(float, 5285.03);
  //   t.end();
  // });
  test('housenumber: removes common english labels', function(t) {
    var float = analyze.housenumber('4701 UNIT #B');
    t.equal(float, 4701.06);
    var float2 = analyze.housenumber('1 APT A');
    t.equal(float2, 1.03);
    t.end();
  });
  test('housenumber: removes common mandarin labels', function(t) {
    t.equal(analyze.housenumber('158號'), 158.00);
    t.end();
  });

  // spanish housenumbers
  // https://www.openstreetmap.org/node/672948135
  test('housenumber: 240 4t', function (t) {
    t.equal(analyze.housenumber('240 4t'), 240);
    t.end();
  });
  test('housenumber: 27, 2º, 4ª ', function (t) {
    t.equal(analyze.housenumber('27, 2º, 4ª'), 27);
    t.end();
  });

  // non-latin apartment letters
  test('housenumber: 18Č', function (t) {
    t.equal(analyze.housenumber('18Č'), 18.09);
    t.end();
  });
};
module.exports.analyze.housenumberFloatToString = function(test) {
  test('housenumberFloatToString: invalid', function(t) {
    t.notOk(analyze.housenumberFloatToString(/not a string/));
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
    var str = analyze.housenumberFloatToString(22.03);
    t.equal(str, '22a');
    t.end();
  });
  test('housenumberFloatToString: apartment B', function(t) {
    var str = analyze.housenumberFloatToString(22.06);
    t.equal(str, '22b');
    t.end();
  });
  test('housenumberFloatToString: apartment C', function(t) {
    var str = analyze.housenumberFloatToString(22.09);
    t.equal(str, '22c');
    t.end();
  });
  test('housenumberFloatToString: apartment D', function(t) {
    var str = analyze.housenumberFloatToString(22.12);
    t.equal(str, '22d');
    t.end();
  });
  test('housenumberFloatToString: apartment W', function(t) {
    var str = analyze.housenumberFloatToString(22.69);
    t.equal(str, '22w');
    t.end();
  });
  test('housenumberFloatToString: apartment X', function(t) {
    var str = analyze.housenumberFloatToString(22.72);
    t.equal(str, '22x');
    t.end();
  });
  test('housenumberFloatToString: apartment Y', function(t) {
    var str = analyze.housenumberFloatToString(22.75);
    t.equal(str, '22y');
    t.end();
  });
  test('housenumberFloatToString: apartment Z', function(t) {
    var str = analyze.housenumberFloatToString(22.78);
    t.equal(str, '22z');
    t.end();
  });
};

module.exports.analyze.encode_decode = function(test) {

  function encodeDecode( num ){
    return analyze.housenumberFloatToString( analyze.housenumber( num ) );
  }

  test('encode then decode should result in same housenumber', function(t) {
    t.equal( encodeDecode('1'), '1' );
    t.equal( encodeDecode('10A'), '10a' );
    t.equal( encodeDecode('3z'), '3z' );
    t.equal( encodeDecode('4/-'), '4' );
    t.equal( encodeDecode('5/5'), '5' );
    t.equal( encodeDecode('6-6'), '6' );
    t.equal( encodeDecode('22-26'), '24' );
    t.equal( encodeDecode('51.5'), '51½' );
    t.equal( encodeDecode('326 1/2'), '326½' );
    t.equal( encodeDecode('8¼'), '8¼' );
    t.equal( encodeDecode('4701 #B'), '4701b' );
    t.equal( encodeDecode('1434 UNIT #B'), '1434b' );

    // test all character house number from [a-z]
    for( var i = 97; i < 123; i++ ){
      var num = '100' + String.fromCharCode(i);
      t.equal( encodeDecode(num), num );
    }
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
