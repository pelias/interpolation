const fs = require('fs');
const os = require('os');
const path = require('path');
const Readable = require('stream').Readable;

const api = {
  oa: require('../../api/oa'),
  osm: require('../../api/osm'),
  polyline: require('../../api/polyline'),
  tiger: require('../../api/tiger'),
  vertices: require('../../api/vertices')
};

module.exports.tests = {};

module.exports.tests.import_completion = function(test){
  test('import APIs invoke their completion callbacks', function(t){
    t.plan(5);
    t.timeoutAfter(5000);

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interpolation-completion-'));
    t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }));
    const streetDb = path.join(dir, 'street.db');
    const oaDb = path.join(dir, 'oa.db');

    const empty = () => Readable.from([]);
    const steps = [
      [ 'polyline', done => api.polyline(empty(), streetDb, done) ],
      [ 'oa', done => api.oa(empty(), oaDb, streetDb, done) ],
      [ 'osm', done => api.osm(empty(), path.join(dir, 'osm.db'), streetDb, done) ],
      [ 'tiger', done => api.tiger(
        Readable.from([ JSON.stringify({ type: 'FeatureCollection', features: [] }) ]),
        path.join(dir, 'tiger.db'),
        streetDb,
        done
      ) ],
      [ 'vertices', done => api.vertices(oaDb, streetDb, done) ]
    ];

    let index = 0;
    function next(){
      const step = steps[index++];
      step[1](function(){
        t.pass(step[0] + ' completion callback');
        if( index < steps.length ){ next(); }
      });
    }

    next();
  });
};

module.exports.all = function(tape){
  function test(name, testFunction){
    return tape('api completion: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test);
  }
};
