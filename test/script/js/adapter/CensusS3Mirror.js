const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const CensusS3Mirror = require('../../../../script/js/adapter/CensusS3Mirror');

module.exports.tests = {};

module.exports.tests.constructor = function (test) {
  test('constructor', function (t) {
    const adapter = new CensusS3Mirror();
    t.equal(typeof adapter.host, 'string');
    t.equal(typeof adapter.prefix, 'string');
    t.end();
  });
};

module.exports.tests.list = function (test) {
  const conform = /^tl_2016_(\d{5})_addrfeat\.zip$/;
  test('list - all', function (t) {
    const adapter = new CensusS3Mirror();
    adapter.list('tl_2016_*_addrfeat.zip', (err, files) => {
      t.equal(files.length, 3220);
      t.true(files.every(f => conform.test(f)));
      t.end();
    });
  });
  test('list - whole state', function (t) {
    const adapter = new CensusS3Mirror();
    adapter.list('tl_2016_72*_addrfeat.zip', (err, files) => {
      t.equal(files.length, 78);
      t.true(files.every(f => conform.test(f)));
      t.end();
    });
  });
  test('list - subset of state', function (t) {
    const adapter = new CensusS3Mirror();
    adapter.list('tl_2016_7200*_addrfeat.zip', (err, files) => {
      t.equal(files.length, 5);
      t.true(files.every(f => conform.test(f)));
      t.end();
    });
  });
  test('list - single file', function (t) {
    const adapter = new CensusS3Mirror();
    adapter.list('tl_2016_72001_addrfeat.zip', (err, files) => {
      t.equal(files.length, 1);
      t.true(files.every(f => conform.test(f)));
      t.end();
    });
  });
};

module.exports.tests.get = function (test) {
  test('get - single file', function (t) {
    const adapter = new CensusS3Mirror();
    const tmpFile = path.join(os.tmpdir(), crypto.randomBytes(16).toString('hex'));
    adapter.get('tl_2016_72149_addrfeat.zip', tmpFile, (err) => {
      const stats = fs.statSync(tmpFile);
      t.equal(stats.size, 42950);
      fs.unlinkSync(tmpFile); // clean up
      t.end();
    });
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('CensusS3Mirror: ' + name, testFunction);
  }

  for (var testCase in module.exports.tests) {
    module.exports.tests[testCase](test);
  }
};
