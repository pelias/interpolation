const fs = require('fs');
const os = require('os');
const path = require('path');
const proxyquire = require('proxyquire').noCallThru();
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

module.exports.tests.index_failure_cleanup = function(test){
  test('import APIs close their databases when indexing fails', function(t){
    const cases = [
      { name: 'oa', index: 'address', invoke: (subject, chain, done) => subject(chain, 'address.db', 'street.db', done) },
      { name: 'osm', index: 'address', invoke: (subject, chain, done) => subject(chain, 'address.db', 'street.db', done) },
      { name: 'tiger', index: 'address', invoke: (subject, chain, done) => subject(chain, 'address.db', 'street.db', done) },
      { name: 'vertices', index: 'address', invoke: (subject, chain, done) => subject('address.db', 'street.db', done) },
      { name: 'polyline', index: 'street', invoke: (subject, chain, done) => subject(chain, 'street.db', done) }
    ];

    t.plan(cases.length * 2);

    cases.forEach(function(testCase){
      const events = [];
      const expected = new Error(testCase.name + ' index failure');
      let finishImport;

      const chain = { pipe: function(){ return this; } };
      const stage = function(){ return {}; };
      const captureImport = function(db, done){
        finishImport = done;
        return {};
      };
      const streams = {
        split: stage,
        batch: stage,
        each: function(){ return chain; },
        oa: { parse: stage, convert: stage },
        osm: { parse: stage, delimited_ranges: stage, convert: stage },
        tiger: { parse: stage, convert: stage },
        polyline: { autoincrement: stage, parse: stage },
        address: { batch: stage, lookup: stage, augment: stage, import: captureImport },
        vertices: { lookup: stage, augment: stage },
        street: { augment: stage, import: captureImport }
      };
      const indexes = {
        address: function(){},
        street: function(){}
      };
      indexes[testCase.index] = function(){
        events.push('index');
        throw expected;
      };
      const query = {
        configure: function(){},
        tables: { address: function(){}, street: function(){} },
        indexes: indexes
      };
      const db = {
        unsafeMode: function(){},
        exec: function(){},
        close: function(){ events.push('close'); }
      };
      const Database = function(){ return db; };
      const requireDir = function(name){
        return '../stream' === name ? streams : query;
      };
      const subject = proxyquire('../../api/' + testCase.name, {
        'better-sqlite3': Database,
        'require-dir': requireDir
      });

      testCase.invoke(subject, chain, function(){ events.push('done'); });

      let caught;
      try {
        finishImport();
      } catch (err) {
        caught = err;
      }

      t.equal(caught, expected, testCase.name + ' preserves the indexing error');
      t.deepEqual(events, [ 'index', 'close' ], testCase.name + ' closes without reporting completion');
    });
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
