'use strict';

const proxyquire = require('proxyquire');


let searchQueryMockResponse;
const searchQueryMock = () => { return searchQueryMockResponse; };

const search = proxyquire('../../api/search', {
  '../query/search': searchQueryMock
});


module.exports.search = {};

module.exports.search.basic = function(test) {
  test('successful exact match query processing', function(t) {

    searchQueryMockResponse = [{
      rowid: 113085,
      id: 44871,
      source: 'OA',
      source_id: 'us/or/portland_metro:f19b33c5a5174c4e',
      housenumber: 4849,
      lat: 45.5529543,
      lon: -122.6125803,
      parity: 'L',
      proj_lat: 45.55281888701433,
      proj_lon: -122.61258105590127
    },
      {
        rowid: 113223,
        id: 44867,
        source: 'OA',
        source_id: 'us/or/portland_metro:3efc492cb3e1d8d8',
        housenumber: 7611,
        lat: 45.5525893,
        lon: -122.5844347,
        parity: 'L',
        proj_lat: 45.55244148967148,
        proj_lon: -122.58443705036781
      },
      {
        rowid: 113224,
        id: 44867,
        source: 'OA',
        source_id: 'us/or/portland_metro:d7ac4201148dd618',
        housenumber: 7712,
        lat: 45.5522609,
        lon: -122.5834267,
        parity: 'R',
        proj_lat: 45.55242477553264,
        proj_lon: -122.58342632618223
      }
    ];

    const point = {
      lat: 45.552399,
      lon: -122.612258
    };

    const housenumber = '7712';
    const names = 'northeast mason street';

    const expected = {
      type: 'exact',
      source: 'OA',
      source_id: 'us/or/portland_metro:d7ac4201148dd618',
      number: '7712',
      lat: 45.5522609,
      lon: -122.5834267
    };

    t.deepEquals(expected, search.queryFunc({}, point, housenumber, names));

    t.end();
  });

  test('successful interpolated query processing', function(t) {

    searchQueryMockResponse = [
      {
        rowid: 113085,
        id: 44871,
        source: 'OA',
        source_id: 'us/or/portland_metro:f19b33c5a5174c4e',
        housenumber: 4849,
        lat: 45.5529543,
        lon: -122.6125803,
        parity: 'L',
        proj_lat: 45.55281888701433,
        proj_lon: -122.61258105590127
      },
      {
        rowid: 113223,
        id: 44867,
        source: 'OA',
        source_id: 'us/or/portland_metro:3efc492cb3e1d8d8',
        housenumber: 7611,
        lat: 45.5525893,
        lon: -122.5844347,
        parity: 'L',
        proj_lat: 45.55244148967148,
        proj_lon: -122.58443705036781
      },
      {
        rowid: 113224,
        id: 44867,
        source: 'OA',
        source_id: 'us/or/portland_metro:d7ac4201148dd618',
        housenumber: 7712,
        lat: 45.5522609,
        lon: -122.5834267,
        parity: 'R',
        proj_lat: 45.55242477553264,
        proj_lon: -122.58342632618223
      }
    ];

    const point = {
      lat: 45.552399,
      lon: -122.612258
    };

    const housenumber = '7690';
    const names = 'northeast mason street';

    const expected = {
      type: 'interpolated',
      source: 'mixed',
      number: '7690',
      lat: 45.5524284,
      lon: -122.5836465
    };

    t.deepEquals(expected, search.queryFunc({}, point, housenumber, names));

    t.end();
  });

  test('no match query processing', function(t) {

    searchQueryMockResponse = [
      {
        rowid: 113085,
        id: 44871,
        source: 'OA',
        source_id: 'us/or/portland_metro:f19b33c5a5174c4e',
        housenumber: 4849,
        lat: 45.5529543,
        lon: -122.6125803,
        parity: 'L',
        proj_lat: 45.55281888701433,
        proj_lon: -122.61258105590127
      },
      {
        rowid: 113232,
        id: 44867,
        source: 'OA',
        source_id: 'us/or/portland_metro:1c2eaeb56ab711d1',
        housenumber: 8031,
        lat: 45.5525587,
        lon: -122.5799865,
        parity: 'L',
        proj_lat: 45.552413295361724,
        proj_lon: -122.57998679214616
      }
    ];

    const point = {
      lat: 45.552399,
      lon: -122.612258
    };

    const housenumber = '9999';
    const names = 'northeast mason street';

    const expected = null;

    t.deepEquals(expected, search.queryFunc({}, point, housenumber, names));

    t.end();
  });

};


module.exports.all = function run(tape) {

  function test(name, testFunction) {
    return tape('api/search: ' + name, testFunction);
  }

  for( var testCase in module.exports.search ){
    module.exports.search[testCase](test);
  }
};

