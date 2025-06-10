const express = require('express');
const polyline = require('@mapbox/polyline');
const search = require('../api/search');
const extract = require('../api/extract');
const street = require('../api/street');
const near = require('../api/near');
const pretty = require('../lib/pretty');
const analyze = require('../lib/analyze');

const morgan = require( 'morgan' );
const logger = require('pelias-logger').get('interpolation');
const through = require( 'through2' );
const _ = require('lodash');
const util = require( 'util' );

// optionally override port/host using env var
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || undefined;

// help text
if( process.argv.length !== 4 ){
  console.error('invalid args.');
  console.error('usage: {addressdb} {streetdb}');
  console.error('example: node cmd/server address.db street.db');
  process.exit(1);
}

const app = express();
app.use(log());

const conn = {
  search: search( process.argv[2], process.argv[3] ),
  extract: extract( process.argv[2], process.argv[3] ),
  street: street( process.argv[3] ),
  near: near( process.argv[3] )
};

function log() {
  morgan.token('url', (req, res) => {
    // if there's a DNT header, just return '/' as the URL
    if (['DNT', 'dnt', 'do_not_track'].some(header => _.has(req.headers, header))) {
      return _.get(req, 'route.path');
    } else {
      return req.originalUrl;
    }
  });

  // 'short' format includes response time but leaves out date
  return morgan('short', {
    stream: through( function write( ln, _, next ){
      logger.info( ln.toString().trim() );
      next();
    })
  });
}

// handle errors as either Error objects or strings
function formatError( err )  {
  if (err instanceof Error) {
    return {
      type: err.name,
      message: err.message
    };
  }
  return {
    message: err
  };
}

// search with geojson view
// eg: http://localhost:3000/search/geojson?lat=-41.288788&lon=174.766843&number=16&street=glasgow%20street
app.get('/search/geojson', function( req, res ){

  var point = { lat: req.query.lat, lon: req.query.lon };
  var number = req.query.number;
  var street = req.query.street;

  conn.search.query( point, number, street, function( err, point ){
    if( err ){ return res.status(400).json( formatError( err ) ); }
    if( !point ){ return res.status(200).json({}); }

    res.json( pretty.geojson.point( point, point.lon, point.lat ) );
  });
});

// search with table view
// eg: http://localhost:3000/search/table?lat=-41.288788&lon=174.766843&number=16&street=glasgow%20street
app.get('/search/table', function( req, res ){

  var point = { lat: req.query.lat, lon: req.query.lon };
  var number = req.query.number;
  var street = req.query.street;

  conn.search.query( point, number, street, function( err, point ){
    if( err ){ return res.status(400).json( formatError( err ) ); }
    if( !point ){ return res.status(200).send(''); }

    res.setHeader('Content-Type', 'text/html');
    res.send( pretty.htmltable([ point ]) );
  });
});

// extract with geojson view
// eg: http://localhost:3000/extract/geojson?lat=-41.288788&lon=174.766843&names=glasgow%20street
app.get('/extract/geojson', function( req, res ){

  var point = { lat: req.query.lat, lon: req.query.lon };
  var names = req.query.names ? req.query.names.split(',') : [];

  conn.extract.query( point, names, function( err, data ){
    if( err ){ return res.status(400).json( formatError( err ) ); }
    if( !data ){ return res.status(200).json({}); }

    res.json( pretty.geojson( data ) );
  });
});

// extract with table view
// eg: http://localhost:3000/extract/table?lat=-41.288788&lon=174.766843&names=glasgow%20street
app.get('/extract/table', function( req, res ){

  var point = { lat: req.query.lat, lon: req.query.lon };
  var names = req.query.names ? req.query.names.split(',') : [];

  conn.extract.query( point, names, function( err, data ){
    if( err ){ return res.status(400).send( err ); }
    if( !data ){ return res.status(200).send(''); }
    if( !data.length ){ return res.status(200).send(''); }

    res.setHeader('Content-Type', 'text/html');
    res.send( pretty.htmltable( data ) );
  });
});

// get streets near point, ordered by proximity to point ASC
// eg: http://localhost:3000/street/near/geojson
app.get('/street/near/geojson', function( req, res ){

  var point = { lat: req.query.lat, lon: req.query.lon };
  var max_distance = req.query.dist || 0.01;

  conn.near.query( point, function( err, ordered ){
    if( err ){ return res.status(400).json( formatError( err ) ); }
    if( !ordered || !ordered.length ){ return res.status(200).json({}); }

    // remove points over a certain distance (in degrees)
    ordered = ordered.filter( function( o ){
      return o.proj.dist <= max_distance;
    });

    var geojson = {
      'type': 'FeatureCollection',
      'features': ordered.map( function( o ){
        return {
          'type': 'Feature',
          'properties': {
            'id': o.street.id,
            'name': Array.isArray( o.street.name ) ? o.street.name[0] : o.street.name,
            'polyline': o.street.line,
            'distance': ( Math.floor(( o.proj.dist || 0 ) * 1000000 ) / 1000000 ),
            'projection': o.proj.point
          },
          'geometry': {
            'type': 'LineString',
            'coordinates': o.street.coordinates
          }
        };
      })
    };

    res.json( geojson );
  });
});

// get street geometry as geojson
// eg: http://localhost:3000/street/1/geojson
app.get('/street/:id/geojson', function( req, res ){

  conn.street.query( req.params.id.split(','), function( err, rows ){
    if( err ){ return res.status(400).json( formatError( err ) ); }
    if( !rows || !rows.length ){ return res.status(200).json({}); }

    // dedupe
    // @todo: debug and improve this by returning less results
    // @copy-pasted
    var deduped = [];
    rows = rows.filter( function( row ){
      if( deduped[ row.id ] ){ return false; }
      deduped[ row.id ] = true;
      return true;
    });

    var geojson = {
      'type': 'FeatureCollection',
      'features': rows.map( function( row ){
        return {
          'type': 'Feature',
          'properties': {
            'id': row.id,
            'name': Array.isArray( row.name ) ? row.name[0] : row.name,
            'polyline': row.line
          },
          'geometry': polyline.toGeoJSON( row.line, 6 )
        };
      })
    };

    res.json( geojson );
  });
});

// root page
app.get('/', function( req, res ){ res.redirect('/demo'); });

// serve the demo app
app.use('/demo', express.static('demo'));

// serve the builds dir (for downloads)
// app.get('/data', function( req, res ){ res.redirect('/builds'); });
// app.use('/builds', express.static('/data/builds'));
// app.use('/builds', directory('/data/builds', { hidden: false, icons: false, view: 'details' }));

app.listen( PORT, HOST, async function() {

  // force loading of libpostal
  await analyze.street( 'test street' );

  console.log(util.format( 'server listening on %s:%s', HOST || '0.0.0.0', PORT ));
});
