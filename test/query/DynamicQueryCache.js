const DynamicQueryCache = require('../../query/DynamicQueryCache');

class MockDatabase {
  constructor() {
    this.name = 'mock';
    this.sql = '';
  }
  prepare(sql) {
    this.sql = sql;
    return this;
  }
}

module.exports.tests = {};

module.exports.tests.interface = function (test) {
  test('interface', (t) => {
    t.equal(typeof DynamicQueryCache, 'function');
    t.equal(DynamicQueryCache.length, 1);
    t.end();
  });
};

module.exports.tests.constructor = function (test) {
  test('constructor', (t) => {
    var cache = new DynamicQueryCache(`SELECT 'test'`);
    t.equal(cache.sql, `SELECT 'test'`);
    t.deepEquals(cache.cache, {});
    t.deepEquals(cache.conditions, []);
    t.end();
  });
  test('constructor - invalid base query', (t) => {
    t.throws(() => { const cache = new DynamicQueryCache(undefined); }, /invalid base query/);
    t.throws(() => { const cache = new DynamicQueryCache(null); }, /invalid base query/);
    t.throws(() => { const cache = new DynamicQueryCache([]); }, /invalid base query/);
    t.throws(() => { const cache = new DynamicQueryCache({}); }, /invalid base query/);
    t.throws(() => { const cache = new DynamicQueryCache(1); }, /invalid base query/);
    t.throws(() => { const cache = new DynamicQueryCache(''); }, /invalid base query/);
    t.end();
  });
};

module.exports.tests.addDynamicCondition = function (test) {
  test('addDynamicCondition', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    const placeholder = '%%TEST%%';
    const map = (i) => `$test${i}`;
    cache.addDynamicCondition(placeholder, map);
    t.deepEquals(cache.conditions, [{placeholder, map, delimiter: 'OR'}]);
    t.end();
  });
  test('addDynamicCondition - invalid placeholder', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    t.throws(() => { cache.addDynamicCondition(undefined); }, /invalid placeholder/);
    t.throws(() => { cache.addDynamicCondition(null); }, /invalid placeholder/);
    t.throws(() => { cache.addDynamicCondition([]); }, /invalid placeholder/);
    t.throws(() => { cache.addDynamicCondition({}); }, /invalid placeholder/);
    t.throws(() => { cache.addDynamicCondition(1); }, /invalid placeholder/);
    t.throws(() => { cache.addDynamicCondition(''); }, /invalid placeholder/);

    t.throws(() => { cache.addDynamicCondition('%%FOO%%', (a) => a); }, /sql does not contain placeholder/);
    t.end();
  });
  test('addDynamicCondition - invalid map function', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    const p = '%%TEST%%';
    t.throws(() => { cache.addDynamicCondition(p, undefined); }, /invalid map function/);
    t.throws(() => { cache.addDynamicCondition(p, null); }, /invalid map function/);
    t.throws(() => { cache.addDynamicCondition(p, []); }, /invalid map function/);
    t.throws(() => { cache.addDynamicCondition(p, {}); }, /invalid map function/);
    t.throws(() => { cache.addDynamicCondition(p, 1); }, /invalid map function/);
    t.throws(() => { cache.addDynamicCondition(p, ''); }, /invalid map function/);
    t.throws(() => { cache.addDynamicCondition(p, () => {}); }, /invalid map function/);
    t.throws(() => { cache.addDynamicCondition(p, (a, b) => {}); }, /invalid map function/);
    t.end();
  });
  test('addDynamicCondition - default delimiter', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    const p = '%%TEST%%';
    const m = (a) => a;
    cache.addDynamicCondition(p, m, undefined);
    t.deepEquals(cache.conditions[0].delimiter, 'OR');
    t.end();
  });
  test('addDynamicCondition - invalid delimiter', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    const p = '%%TEST%%';
    const m = (a) => a;
    t.throws(() => { cache.addDynamicCondition(p, m, null); }, /invalid delimiter/);
    t.throws(() => { cache.addDynamicCondition(p, m, []); }, /invalid delimiter/);
    t.throws(() => { cache.addDynamicCondition(p, m, {}); }, /invalid delimiter/);
    t.throws(() => { cache.addDynamicCondition(p, m, 1); }, /invalid delimiter/);
    t.throws(() => { cache.addDynamicCondition(p, m, ''); }, /invalid delimiter/);
    t.end();
  });
};

module.exports.tests._generateDynamicSQL = function (test) {
  test('_generateDynamicSQL - no conditions', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    const sql = cache._generateDynamicSQL();
    t.equals(sql, `SELECT * WHERE %%TEST%%`);
    t.end();
  });
  test('_generateDynamicSQL - no dynamic counts', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    cache.addDynamicCondition('%%TEST%%', (i) => `$test${i}`);
    t.throws(() => { cache._generateDynamicSQL(); }, /invalid counts supplied 0, requires 1/ );
    t.end();
  });
  test('_generateDynamicSQL - with dynamic counts', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    cache.addDynamicCondition('%%TEST%%', (i) => `$test${i}`);
    const sql = cache._generateDynamicSQL(3);
    t.equals(sql, `SELECT * WHERE $test0 OR $test1 OR $test2`);
    t.end();
  });
};

module.exports.tests.getStatement = function (test) {
  test('getStatement - no conditions', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    const db = new MockDatabase();
    const stmt = cache.getStatement(db);
    t.deepEquals(cache.cache, { mock: { name: 'mock', sql: 'SELECT * WHERE %%TEST%%' } });
    t.equals(stmt.sql, `SELECT * WHERE %%TEST%%`);
    t.end();
  });
  test('getStatement - no dynamic counts', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    const db = new MockDatabase();
    cache.addDynamicCondition('%%TEST%%', (i) => `$test${i}`);
    t.throws(() => { cache.getStatement(db); }, /invalid counts supplied 0, requires 1/);
    t.end();
  });
  test('getStatement - with dynamic counts', (t) => {
    const cache = new DynamicQueryCache(`SELECT * WHERE %%TEST%%`);
    const db = new MockDatabase();
    cache.addDynamicCondition('%%TEST%%', (i) => `$test${i}`);
    const stmt = cache.getStatement(db, 3);
    t.deepEquals(cache.cache, { 'mock:3': { name: 'mock', sql: `SELECT * WHERE $test0 OR $test1 OR $test2` } });
    t.equals(stmt.sql, `SELECT * WHERE $test0 OR $test1 OR $test2`);
    t.end();
  });
};

module.exports.all = function (tape) {

  function test(name, testFunction) {
    return tape('DynamicQueryCache: ' + name, testFunction);
  }

  for (var testCase in module.exports.tests) {
    module.exports.tests[testCase](test);
  }
};
