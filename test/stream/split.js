
var through = require('through2'),
    split = require('../../stream/split');

module.exports.split = {};

module.exports.split.trim_newlines = function(test) {
  test('split should trim newlines', function(t) {

    var polyline = 'a\nb\n';

    stream( polyline, function( items ){
      t.equal( items[0], 'a' );
      t.equal( items[1], 'b' );
      t.end();
    });
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('split: ' + name, testFunction);
  }

  for( var testCase in module.exports.split ){
    module.exports.split[testCase](test);
  }
};

// generic stream test runner
function stream( polyline, cb ){

  var xform = split();
  var records = [];

  var collect = function( chunk, _, next ){
    records.push( chunk );
    next();
  };

  var assert = function( next ){
    cb( records );
    next();
  };

  xform.pipe( through.obj( collect, assert ));
  xform.write( polyline );
  xform.end();
}
