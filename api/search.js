
'use strict';

const Database = require('better-sqlite3');
const requireDir = require('require-dir');
const query = requireDir('../query');
const project = require('../lib/project');
const geodesic = require('../lib/geodesic');
const analyze = require('../lib/analyze');

const logger = require('pelias-logger').get('interpolation');
const searchQuery = require('../query/search');

// export setup method
function setup( addressDbPath, streetDbPath ){

  // connect to db
  const dbOptions = {
    memory: false,
    readonly: true,
    fileMustExist: true
  };
  const db = new Database( addressDbPath, dbOptions );

  // attach street database
  // this will throw an exception if something goes wrong
  query.attach_better( db, streetDbPath, 'street' );

  // return methods
  return {
    query: queryFunc.bind(null, db),

    // close method to close db
    close: db.close.bind( db ),
  };
}

/**
 * @param {better-sqlite3.Database} db
 * @param {object} coord
 * @param {number} coord.lat
 * @param {number} coord.lon
 * @param {string} number (housenumber)
 * @param {string} street
 * @returns {*}
 */
function queryFunc ( db, coord, number, street ) {

  const point = {
    lat: parseFloat( coord.lat ),
    lon: parseFloat( coord.lon )
  };

  if( 'string' !== typeof number ){ throw new Error( 'invalid number' ); }
  if( 'string' !== typeof street ){ throw new Error( 'invalid street' ); }

  const normalized = {
    number: analyze.housenumber( number ),
    street: analyze.street( street )
  };

  // error checking
  if( isNaN( point.lat ) ){ throw new Error( 'invalid latitude' ); }
  if( isNaN( point.lon ) ){ throw new Error( 'invalid longitude' ); }
  if( isNaN( normalized.number ) ){ throw new Error( 'invalid number' ); }
  if( !normalized.street.length ){ throw new Error( 'invalid street' ); }

  // perform a db lookup for the specified street
  // @todo: performance: only query for part of the table
  try {
    const res = searchQuery(db, point, normalized.number, normalized.street);

    if( !res || !res.length ) {
      logger.debug('search query returned no results', res);
      return null;
    }

    // @note: results can be from multiple different street ids.
    return processResponse(normalized, res);
  }
  catch (err) {
    logger.error(err.message);
    // an error occurred or no results were found
    throw new Error('something went wrong while searching', err);
  }
}


/**
 * @param normalized
 * @param res
 * @returns {*}
 */
function processResponse(normalized, res) {

  // try to find an exact match
  let match = getExactMatch(normalized, res);
  if( match ){
    logger.debug('exact match found');
    return {
      type: 'exact',
      source: match.source,
      source_id: match.source_id,
      number: analyze.housenumberFloatToString( match.housenumber ),
      lat: parseFloat( match.lat.toFixed(7) ),
      lon: parseFloat( match.lon.toFixed(7) )
    };
  }

  // try to find a close match with the same number (possibly an apartment)
  match = getCloseMatch(normalized, res);
  if( match ){
    logger.debug('close match found');
    return {
      type: 'close',
      source: match.source,
      source_id: match.source_id,
      number: analyze.housenumberFloatToString( match.housenumber ),
      lat: parseFloat( match.lat.toFixed(7) ),
      lon: parseFloat( match.lon.toFixed(7) )
    };
  }

  // attempt to interpolate the position
  const segments = getSegments(normalized, res);

  // could not find two rows to use for interpolation
  if( !segments.length ){
    logger.debug('no segments for interpolation found');
    return null;
  }

  const point = getInterpolatedPoint(normalized, segments);

  logger.debug('returning interpolated result');

  // return interpolated address
  return {
    type: 'interpolated',
    source: 'mixed',
    number: '' + Math.floor( normalized.number ),
    lat: parseFloat( project.toDeg( point.lat ).toFixed(7) ),
    lon: parseFloat( project.toDeg( point.lon ).toFixed(7) )
  };
}

function getExactMatch(normalized, res) {
  return res.find( ( row ) => {
    if( row.source === 'VERTEX' ){ return false; }
    return row.housenumber === normalized.number;
  });
}

function getCloseMatch(normalized, res) {
  // try to find a close match with the same number (possibly an apartment)
  return res.find( function( row ){
    if( row.source === 'VERTEX' ){ return false; }
    return Math.floor( row.housenumber ) === Math.floor( normalized.number );
  });
}

function getSegments(normalized, res) {
  // find the records before and after the desired number (group by street segment)
  const map = {};
  res.forEach( function( row ){
    if( !map.hasOwnProperty( row.id ) ){ map[row.id] = {}; }
    if( row.housenumber < normalized.number ){ map[row.id].before = row; }
    if( row.housenumber > normalized.number ){ map[row.id].after = row; }
    if( map[row.id].before && map[row.id].after ){
      map[row.id].diff = {
        before: map[row.id].before.housenumber - normalized.number,
        after: map[row.id].after.housenumber - normalized.number
      };
    }
  });

  // remove segments with less than 2 points; convert map to array
  const segments = [];
  for( let id in map ){
    if( map[id].before && map[id].after ){
      segments.push( map[id] );
    }
  }

  return segments;
}

function getInterpolatedPoint(normalized, segments) {

  // sort by minimum housenumber difference from target housenumber ASC
  segments.sort( ( a, b ) => {
    return Math.abs( a.diff.before + a.diff.after ) - Math.abs( b.diff.before + b.diff.after );
  });

  // select before/after values to use for the interpolation
  const before = segments[0].before;
  const after = segments[0].after;

  // compute interpolated address
  const A = { lat: project.toRad( before.proj_lat ), lon: project.toRad( before.proj_lon ) };
  const B = { lat: project.toRad( after.proj_lat ), lon: project.toRad( after.proj_lon ) };
  const distance = geodesic.distance( A, B );

  // if distance = 0 then we can simply use either A or B (they are the same lat/lon)
  // else we interpolate between the two positions
  let point = A;
  if( distance > 0 ){
    const ratio = ((normalized.number - before.housenumber) / (after.housenumber - before.housenumber));
    point = geodesic.interpolate( distance, ratio, A, B );
  }

  return point;
}


module.exports = {
  setup: setup,
  queryFunc: queryFunc
};
