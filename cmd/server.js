
var express = require('express'),
    polyline = require('polyline'),
    search = require('../api/search'),
    extract = require('../api/extract'),
    street = require('../api/street'),
    pretty = require('../lib/pretty'),
    analyze = require('../lib/analyze');

// optionally override port using env var
var PORT = process.env.PORT || 3000;

// help text
if( process.argv.length !== 4 ){
  console.error('invalid args.');
  console.error('usage: {addressdb} {streetdb}');
  console.error('example: node cmd/server address.db street.db');
  process.exit(1);
}

var app = express();
var conn = {
  search: search( process.argv[2], process.argv[3] ),
  extract: extract( process.argv[2], process.argv[3] ),
  street: street( process.argv[3] )
};

// search with geojson view
// eg: http://localhost:3000/search/geojson?lat=-41.288788&lon=174.766843&number=16&street=glasgow%20street
app.get('/search/geojson', function( req, res ){

  var point = { lat: req.query.lat, lon: req.query.lon };
  var number = req.query.number;
  var street = req.query.street;

  conn.search.query( point, number, street, function( err, point ){
    if( err ){ return res.status(400).json( err ); }
    if( !point ){ return res.status(404).json({}); }

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
    if( err ){ return res.status(400).json( err ); }
    if( !point ){ return res.status(404).send(''); }

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
    if( err ){ return res.status(400).json( err ); }
    if( !data ){ return res.status(404).json({}); }

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
    if( !data ){ return res.status(404).send(''); }
    if( !data.length ){ return res.status(404).send(''); }

    res.setHeader('Content-Type', 'text/html');
    res.send( pretty.htmltable( data ) );
  });
});

// get street geometry as geojson
// eg: http://localhost:3000/street/1/geojson
app.get('/street/:id/geojson', function( req, res ){

  conn.street.query( req.params.id.split(','), function( err, rows ){
    if( err ){ return res.status(400).json( err ); }
    if( !rows || !rows.length ){ return res.status(404).json({}); }

    // dedupe
    // @todo: debug and improve this by returning less results
    // @copy-pasted
    var deduped = [];
    rows = rows.filter( function( row ){
      if( deduped[ row.id ] ){ return false; }
      deduped[ row.id ] = true;
      return true;
    });

    var features = rows.map( function( row ){

      var gj = polyline.toGeoJSON( row.line, 6 );
      gj.properties = {
        name: Array.isArray( row.name ) ? row.name[0] : row.name
      };
      return gj;
    });

    var geojson = {
      'type': 'FeatureCollection',
      'features': features
    };

    res.json( geojson );
  });
});

// root page
app.get('/', function( req, res ){ res.redirect('/demo'); });

// serve the demo app
app.use('/demo', express.static('demo'));

app.listen( PORT, function() {

  // force loading of libpostal
  analyze.street( 'test street' );

  console.log( 'server listening on port', PORT );
});
