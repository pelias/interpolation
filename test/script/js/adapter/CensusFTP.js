const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const JSFtp = require('jsftp');
const CensusFTP = require('../../../../script/js/adapter/CensusFTP');

module.exports.tests = {};

module.exports.tests.constructor = function (test) {
  test('constructor', function (t) {
    const adapter = new CensusFTP();
    t.true(adapter.client instanceof JSFtp);
    t.equal(typeof adapter.prefix, 'string');
    adapter.client.socket.end();
    t.end();
  });
};

module.exports.tests.list = function (test) {
  const conform = /^tl_2016_(\d{5})_addrfeat\.zip$/;
  test('list - all', function (t) {
    const adapter = new CensusFTP();
    adapter.list('tl_2016_*_addrfeat.zip', (err, files) => {
      t.equal(files.length, 3220);
      t.true(files.every(f => conform.test(f)));
      adapter.client.socket.end();
      t.end();
    });
  });
  test('list - whole state', function (t) {
    const adapter = new CensusFTP();
    adapter.list('tl_2016_72*_addrfeat.zip', (err, files) => {
      t.equal(files.length, 78);
      t.true(files.every(f => conform.test(f)));
      adapter.client.socket.end();
      t.end();
    });
  });
  test('list - subset of state', function (t) {
    const adapter = new CensusFTP();
    adapter.list('tl_2016_7200*_addrfeat.zip', (err, files) => {
      t.equal(files.length, 5);
      t.true(files.every(f => conform.test(f)));
      adapter.client.socket.end();
      t.end();
    });
  });
  test('list - single file', function (t) {
    const adapter = new CensusFTP();
    adapter.list('tl_2016_72001_addrfeat.zip', (err, files) => {
      t.equal(files.length, 1);
      t.true(files.every(f => conform.test(f)));
      adapter.client.socket.end();
      t.end();
    });
  });
};

module.exports.tests.get = function (test) {
  test('get - single file', function (t) {
    const adapter = new CensusFTP();
    const tmpFile = path.join(os.tmpdir(), crypto.randomBytes(16).toString('hex'));
    adapter.get('tl_2016_72149_addrfeat.zip', tmpFile, (err) => {
      const stats = fs.statSync(tmpFile);
      t.equal(stats.size, 42950);
      adapter.client.socket.end();
      fs.unlinkSync(tmpFile); // clean up
      t.end();
    });
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('CensusFTP: ' + name, testFunction);
  }

  for (var testCase in module.exports.tests) {
    module.exports.tests[testCase](test);
  }
};
