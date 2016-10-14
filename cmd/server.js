
var express = require('express'),
    extract = require('../api/extract'),
    pretty = require('../lib/pretty');

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
var conn = extract( process.argv[2], process.argv[3] );

// extract with json view
// eg: http://localhost:3000/extract/geojson?lat=-41.288788&lon=174.766843&names=glasgow%20street
app.get('/extract/geojson', function( req, res ){

  var point = { lat: req.query.lat, lon: req.query.lon };
  var names = req.query.names ? req.query.names.split(',') : [];

  conn.query( point, names, function( err, data ){
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

  conn.query( point, names, function( err, data ){
    if( err ){ return res.status(400).send( err ); }
    if( !data ){ return res.status(404).send(''); }
    if( !data.length ){ return res.status(404).send(''); }

    res.setHeader('Content-Type', 'text/html');
    res.send( pretty.htmltable( data ) );
  });
});

// serve the demo app
app.use('/demo', express.static('demo'));

app.listen( PORT, function() {
  console.log( 'server listening on port', PORT );
});
